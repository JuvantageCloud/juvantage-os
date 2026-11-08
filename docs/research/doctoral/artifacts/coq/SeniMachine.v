(**
  Adversary machine for the SENI grant.

  The adversary language is Noise, Advance (time), and Submit.
  It cannot mint. Mint is a separate host step that stores a tag
  mac = key + gid + nonce.

  Checked claim:
    - with no grant, no command list produces an effect
    - from a store that has produced nothing yet, commands produce
      at most one effect
    - a second commit of the same token does not add another effect
    - a token whose mac is not key+gid+nonce is rejected
    - a fresh token past its exp is rejected
    - one concrete stolen token produces exactly one effect

  Not checked: EUF-CMA of HMAC-SHA256, concurrency inside SQLite,
  or the real apps/api ApprovalGrant code. mac equality here is the
  model of "verify", not a cryptographic reduction.
*)

From Stdlib Require Import List Arith Lia Bool.
Import ListNotations.

Record Tok := { gid : nat; nonce : nat; mac : nat; exp : nat }.

Inductive GSt := Fresh | Consumed.

Record Store := {
  grant : option (Tok * GSt);
  effects : nat;
  now : nat
}.

Definition empty : Store := {| grant := None; effects := 0; now := 0 |}.

Definition mint (key gid0 nonce0 exp0 : nat) (s : Store) : Store :=
  let t := {| gid := gid0; nonce := nonce0; mac := key + gid0 + nonce0; exp := exp0 |} in
  {| grant := Some (t, Fresh); effects := effects s; now := now s |}.

Definition accept (key : nat) (t t0 : Tok) (now0 : nat) : bool :=
  (Nat.eqb (mac t) (key + gid t0 + nonce t0)
   && Nat.eqb (gid t) (gid t0)
   && Nat.eqb (nonce t) (nonce t0)
   && Nat.eqb (mac t) (mac t0)
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

Theorem no_mint_no_effect :
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

Theorem at_most_one_effect :
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

Theorem commit_second_adds_nothing :
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

Theorem forge_rejected :
  forall key gid0 nonce0 exp0 s t,
    mac t <> key + gid0 + nonce0 ->
    effects (commit key t (mint key gid0 nonce0 exp0 s)) = effects s.
Proof.
  intros key gid0 nonce0 exp0 s t Hmac.
  set (s1 := mint key gid0 nonce0 exp0 s).
  assert (Hg : grant s1 =
    Some ({| gid := gid0; nonce := nonce0; mac := key + gid0 + nonce0; exp := exp0 |}, Fresh)).
  { unfold s1, mint. reflexivity. }
  unfold commit. rewrite Hg.
  assert (Hneq : Nat.eqb (mac t) (key + gid0 + nonce0) = false)
    by (apply Nat.eqb_neq; exact Hmac).
  unfold accept. simpl. rewrite Hneq. simpl.
  unfold s1, mint. simpl. reflexivity.
Qed.

Theorem expired_no_effect :
  forall key t s t0,
    grant s = Some (t0, Fresh) ->
    exp t0 < now s ->
    effects (commit key t s) = effects s.
Proof.
  intros key t s t0 Hg Hexp.
  unfold commit. rewrite Hg.
  assert (Hleb : Nat.leb (now s) (exp t0) = false)
    by (apply Nat.leb_gt; exact Hexp).
  unfold accept. rewrite Hleb. rewrite Bool.andb_false_r.
  simpl. reflexivity.
Qed.

Theorem stolen_once_concrete :
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

Theorem expired_concrete :
  let key := 7 in
  let s0 := tick (mint key 1 2 0 empty) in
  effects (commit key {| gid := 1; nonce := 2; mac := key + 1 + 2; exp := 0 |} s0) = 0.
Proof.
  vm_compute. reflexivity.
Qed.
