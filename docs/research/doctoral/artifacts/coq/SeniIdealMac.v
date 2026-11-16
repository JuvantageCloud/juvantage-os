(**
  Ideal-MAC SENI (symbolic EUF for the grant tag).

  SeniMachine.v used mac := key + gid + nonce. That admits collisions
  (e.g. (k,g,n) vs (k+1,g,n-1)) and is not a cryptographic reduction.
  MACHINE_CHECK scored “SENI including EUF-CMA of HMAC” at 48.

  This file replaces the tag with an ideal MAC:
    Tag := (key, gid, nonce) compared componentwise.
  Signing is the only way to produce a verifying tag for that key.
  No arithmetic collisions.

  Checked (symbolic EUF / ideal MAC model):
    - verify ⇒ tag equals the unique honest signature
    - injective: equal tags ⇒ equal (key,gid,nonce)
    - adversary-submitted tag with wrong key never verifies
    - no mint ⇒ no effects
    - at most one effect from a fresh grant
    - second commit adds nothing
    - concrete stolen token: exactly one effect

  Not checked: HMAC-SHA256, EUF-CMA in the asymptotic PPT sense,
  apps/api ApprovalGrant concurrency.
*)

From Stdlib Require Import List Arith Lia Bool.
Import ListNotations.

(** Ideal tag: the MAC *is* the keyed message. Verify = equality on all parts. *)
Record Tag := { tk : nat; tg : nat; tn : nat }.

Definition sign (key gid0 nonce0 : nat) : Tag :=
  {| tk := key; tg := gid0; tn := nonce0 |}.

Definition verify (key gid0 nonce0 : nat) (t : Tag) : bool :=
  (Nat.eqb (tk t) key
   && Nat.eqb (tg t) gid0
   && Nat.eqb (tn t) nonce0)%bool.

Theorem verify_sign :
  forall key gid0 nonce0,
    verify key gid0 nonce0 (sign key gid0 nonce0) = true.
Proof.
  intros. unfold verify, sign. simpl.
  rewrite !Nat.eqb_refl. reflexivity.
Qed.

Theorem verify_implies_sign :
  forall key gid0 nonce0 t,
    verify key gid0 nonce0 t = true ->
    t = sign key gid0 nonce0.
Proof.
  intros key gid0 nonce0 t Hv.
  unfold verify in Hv.
  apply Bool.andb_true_iff in Hv. destruct Hv as [Hv1 Hv2].
  apply Bool.andb_true_iff in Hv1. destruct Hv1 as [Hk Hg].
  apply Nat.eqb_eq in Hk.
  apply Nat.eqb_eq in Hg.
  apply Nat.eqb_eq in Hv2.
  destruct t as [k g n]. simpl in *. subst. reflexivity.
Qed.

Theorem sign_injective :
  forall k1 g1 n1 k2 g2 n2,
    sign k1 g1 n1 = sign k2 g2 n2 ->
    k1 = k2 /\ g1 = g2 /\ n1 = n2.
Proof.
  intros. inversion H. subst. repeat split.
Qed.

(** No collision across distinct keys (contrast: key+gid+nonce). *)
Theorem different_keys_different_tags :
  forall k1 k2 g n,
    k1 <> k2 ->
    sign k1 g n <> sign k2 g n.
Proof.
  intros k1 k2 g n Hne Heq.
  apply sign_injective in Heq. destruct Heq as [Hk _]. contradiction.
Qed.

Theorem wrong_key_rejected :
  forall key key' gid0 nonce0,
    key <> key' ->
    verify key gid0 nonce0 (sign key' gid0 nonce0) = false.
Proof.
  intros key key' gid0 nonce0 Hne.
  unfold verify, sign. simpl.
  assert (He : Nat.eqb key' key = false) by (apply Nat.eqb_neq; intros Heq; apply Hne; symmetry; exact Heq).
  rewrite He. reflexivity.
Qed.

(** ---------- SENI machine under ideal MAC ---------- *)

Record Tok := { gid : nat; nonce : nat; mac : Tag; exp : nat }.

Inductive GSt := Fresh | Consumed.

Record Store := {
  grant : option (Tok * GSt);
  effects : nat;
  now : nat
}.

Definition empty : Store := {| grant := None; effects := 0; now := 0 |}.

Definition mint (key gid0 nonce0 exp0 : nat) (s : Store) : Store :=
  let t := {| gid := gid0; nonce := nonce0;
              mac := sign key gid0 nonce0; exp := exp0 |} in
  {| grant := Some (t, Fresh); effects := effects s; now := now s |}.

Definition accept (key : nat) (t t0 : Tok) (now0 : nat) : bool :=
  (verify key (gid t0) (nonce t0) (mac t)
   && Nat.eqb (gid t) (gid t0)
   && Nat.eqb (nonce t) (nonce t0)
   && Nat.leb now0 (exp t0))%bool.

Definition commit (key : nat) (t : Tok) (s : Store) : Store :=
  match grant s with
  | Some (t0, Fresh) =>
      if accept key t t0 (now s)
      then {| grant := Some (t0, Consumed); effects := S (effects s); now := now s |}
      else s
  | _ => s
  end.

Definition tick (s : Store) : Store :=
  {| grant := grant s; effects := effects s; now := S (now s) |}.

Definition credit (s : Store) : nat :=
  match grant s with
  | Some (_, Fresh) => 1
  | _ => 0
  end.

Inductive Cmd :=
| Noise
| Advance
| Submit (t : Tok).

Fixpoint exec (key : nat) (cmds : list Cmd) (s : Store) : Store :=
  match cmds with
  | [] => s
  | Noise :: rest => exec key rest s
  | Advance :: rest => exec key rest (tick s)
  | Submit t :: rest => exec key rest (commit key t s)
  end.

Lemma tick_sum :
  forall s, effects (tick s) + credit (tick s) = effects s + credit s.
Proof.
  intro s. unfold tick, credit. simpl.
  destruct (grant s) as [[t0 [|]] |]; simpl; reflexivity.
Qed.

Lemma commit_sum :
  forall key t s,
    effects (commit key t s) + credit (commit key t s) <= effects s + credit s.
Proof.
  intros key t s.
  unfold commit.
  destruct (grant s) as [[t0 st] |] eqn:Hg.
  - destruct st.
    + destruct (accept key t t0 (now s)) eqn:Ea.
      * simpl. unfold credit. simpl. rewrite Hg. simpl.
        rewrite Nat.add_0_r. rewrite <- Nat.add_1_r. apply Nat.le_refl.
      * unfold credit. rewrite Hg. simpl. apply Nat.le_refl.
    + unfold credit. rewrite Hg. simpl. apply Nat.le_refl.
  - unfold credit. rewrite Hg. simpl. apply Nat.le_refl.
Qed.

Lemma exec_sum :
  forall key cmds s,
    effects (exec key cmds s) + credit (exec key cmds s) <= effects s + credit s.
Proof.
  intros key cmds.
  induction cmds as [| c rest IH]; intros s.
  - simpl. apply Nat.le_refl.
  - destruct c as [| | tok].
    + simpl. apply IH.
    + simpl.
      apply Nat.le_trans with (m := effects (tick s) + credit (tick s)).
      * apply IH.
      * rewrite tick_sum. apply Nat.le_refl.
    + simpl.
      apply Nat.le_trans with (m := effects (commit key tok s) + credit (commit key tok s)).
      * apply IH.
      * apply commit_sum.
Qed.

Theorem ideal_no_mint_no_effect :
  forall key cmds, effects (exec key cmds empty) = 0.
Proof.
  intros key cmds.
  pose proof (exec_sum key cmds empty) as Hsum.
  unfold empty, credit in Hsum. simpl in Hsum.
  apply Nat.le_0_r.
  eapply Nat.le_trans.
  - apply Nat.le_add_r.
  - exact Hsum.
Qed.

Theorem ideal_at_most_one_effect :
  forall key cmds s,
    effects s = 0 ->
    effects (exec key cmds s) <= 1.
Proof.
  intros key cmds s He.
  pose proof (exec_sum key cmds s) as Hsum.
  assert (Hc : credit s <= 1).
  { unfold credit. destruct (grant s) as [[? [|]] |]; simpl.
    - apply Nat.le_refl.
    - apply Nat.le_0_l.
    - apply Nat.le_0_l. }
  rewrite He in Hsum. rewrite Nat.add_0_l in Hsum.
  eapply Nat.le_trans.
  - apply Nat.le_add_r.
  - eapply Nat.le_trans. exact Hsum. exact Hc.
Qed.

Theorem ideal_commit_second_adds_nothing :
  forall key t s,
    effects (commit key t (commit key t s)) = effects (commit key t s).
Proof.
  intros key t s.
  destruct (grant s) as [[t0 [|]] |] eqn:Hg.
  - destruct (accept key t t0 (now s)) eqn:Ea.
    + set (s1 := {| grant := Some (t0, Consumed); effects := S (effects s); now := now s |}).
      assert (Hc : commit key t s = s1).
      { unfold commit, s1. rewrite Hg. rewrite Ea. reflexivity. }
      rewrite Hc.
      unfold commit, s1. simpl. reflexivity.
    + assert (Hc : commit key t s = s).
      { unfold commit. rewrite Hg. rewrite Ea. reflexivity. }
      rewrite Hc. rewrite Hc. reflexivity.
  - assert (Hc : commit key t s = s).
    { unfold commit. rewrite Hg. reflexivity. }
    rewrite Hc. rewrite Hc. reflexivity.
  - assert (Hc : commit key t s = s).
    { unfold commit. rewrite Hg. reflexivity. }
    rewrite Hc. rewrite Hc. reflexivity.
Qed.

(** Symbolic unforgeability: a tag signed under the wrong key cannot commit. *)
Theorem ideal_forge_wrong_key_rejected :
  forall key key' gid0 nonce0 exp0 s,
    key <> key' ->
    let forged := {| gid := gid0; nonce := nonce0;
                     mac := sign key' gid0 nonce0; exp := exp0 |} in
    effects (commit key forged (mint key gid0 nonce0 exp0 s)) = effects s.
Proof.
  intros key key' gid0 nonce0 exp0 s Hne.
  set (s1 := mint key gid0 nonce0 exp0 s).
  set (forged := {| gid := gid0; nonce := nonce0;
                    mac := sign key' gid0 nonce0; exp := exp0 |}).
  assert (Hg : grant s1 =
    Some ({| gid := gid0; nonce := nonce0;
             mac := sign key gid0 nonce0; exp := exp0 |}, Fresh)).
  { unfold s1, mint. reflexivity. }
  unfold commit. rewrite Hg.
  assert (Hv : verify key gid0 nonce0 (sign key' gid0 nonce0) = false)
    by (apply wrong_key_rejected; exact Hne).
  unfold accept. simpl. rewrite Hv. simpl.
  unfold s1, mint. simpl. reflexivity.
Qed.

Theorem ideal_stolen_once_concrete :
  let key := 7 in
  let s0 := mint key 1 2 9 empty in
  match grant s0 with
  | Some (t, Fresh) =>
      let s2 := exec key [Submit t; Submit t] s0 in
      effects s2 = 1 /\ credit s2 = 0
  | _ => False
  end.
Proof.
  vm_compute. split; reflexivity.
Qed.
