(**
  Bounded ring: safety, one-step try, and the failure of blocking retry.

  Indices only. Occupy increments tail when gap < N. Consume increments
  head when head < tail. Failed attempts leave the ring unchanged.

  Checked claim:
    - every finite trace from (0, 0) keeps head <= tail and gap <= N
    - if there is space, one try_occupy moves tail forward by 1
    - try_occupy is one application: it returns Some or None
    - retry-until-enqueued on a full ring returns None for every bound

  The last theorem is the negation of wait-freedom for a blocking enqueue
  while the consumer is stalled. A try that may return "full" is not that
  claim. Lock-freedom of a CAS loop under perpetual contention is not
  formalized here; the stalled-consumer counterexample is.
*)

From Stdlib Require Import List Arith Lia.
Import ListNotations.

Record Ring := { head : nat; tail : nat }.

Definition gap (r : Ring) : nat := tail r - head r.

Definition inv (N : nat) (r : Ring) : Prop :=
  head r <= tail r /\ gap r <= N.

Definition try_occupy (N : nat) (r : Ring) : option Ring :=
  if gap r <? N
  then Some {| head := head r; tail := S (tail r) |}
  else None.

Definition try_consume (r : Ring) : option Ring :=
  if head r <? tail r
  then Some {| head := S (head r); tail := tail r |}
  else None.

Lemma occupy_preserves :
  forall N r r',
    inv N r ->
    try_occupy N r = Some r' ->
    inv N r'.
Proof.
  intros N r r' [Hle Hgap] Hsome.
  unfold try_occupy in Hsome.
  destruct (gap r <? N) eqn:E.
  - apply Nat.ltb_lt in E.
    assert (r' = {| head := head r; tail := S (tail r) |}) by congruence.
    rewrite H.
    assert (Hcut : forall h t : nat,
        h <= t -> t - h <= N -> t - h < N -> h <= S t /\ S t - h <= N).
    { intros h t Hh Ht Hlt. lia. }
    unfold inv, gap. simpl. apply Hcut; assumption.
  - discriminate.
Qed.

Lemma consume_preserves :
  forall N r r',
    inv N r ->
    try_consume r = Some r' ->
    inv N r'.
Proof.
  intros N r r' [Hle Hgap] Hsome.
  unfold try_consume in Hsome.
  destruct (head r <? tail r) eqn:E.
  - apply Nat.ltb_lt in E.
    assert (r' = {| head := S (head r); tail := tail r |}) by congruence.
    rewrite H.
    assert (Hcut : forall h t : nat,
        h <= t -> t - h <= N -> h < t -> S h <= t /\ t - S h <= N).
    { intros h t Hh Ht Hlt. lia. }
    unfold inv, gap. simpl. apply Hcut; assumption.
  - discriminate.
Qed.

Inductive Act := Occupy | Consume.

Fixpoint run (N : nat) (r : Ring) (acts : list Act) : Ring :=
  match acts with
  | [] => r
  | Occupy :: rest =>
      match try_occupy N r with
      | Some r' => run N r' rest
      | None => run N r rest
      end
  | Consume :: rest =>
      match try_consume r with
      | Some r' => run N r' rest
      | None => run N r rest
      end
  end.

Lemma run_preserves :
  forall acts N r, inv N r -> inv N (run N r acts).
Proof.
  induction acts as [| a rest IH]; intros N r H.
  - exact H.
  - destruct a; simpl.
    + destruct (try_occupy N r) eqn:E.
      * apply IH. eapply occupy_preserves; eauto.
      * apply IH. exact H.
    + destruct (try_consume r) eqn:E.
      * apply IH. eapply consume_preserves; eauto.
      * apply IH. exact H.
Qed.

Theorem no_overwrite :
  forall acts N, inv N (run N {| head := 0; tail := 0 |} acts).
Proof.
  intros acts N. apply run_preserves. unfold inv, gap. simpl.
  split. apply Nat.le_refl. apply Nat.le_0_l.
Qed.

Theorem try_occupy_decides :
  forall N r, try_occupy N r = None \/ exists r', try_occupy N r = Some r'.
Proof.
  intros N r. destruct (try_occupy N r) eqn:E.
  - right. exists r0. reflexivity.
  - left. reflexivity.
Qed.

Theorem occupy_enabled :
  forall N r,
    gap r < N ->
    exists r', try_occupy N r = Some r' /\ tail r' = S (tail r) /\ head r' = head r.
Proof.
  intros N r Hg.
  unfold try_occupy.
  destruct (gap r <? N) eqn:E.
  - eexists. split. reflexivity. simpl. split; reflexivity.
  - apply Nat.ltb_ge in E. exfalso.
    apply (Nat.lt_irrefl (gap r)).
    eapply Nat.lt_le_trans. exact Hg. exact E.
Qed.

Definition full (N : nat) : Ring := {| head := 0; tail := N |}.

Lemma occupy_full_none : forall N, try_occupy N (full N) = None.
Proof.
  intro N. unfold try_occupy, full, gap. simpl.
  rewrite Nat.sub_0_r. rewrite Nat.ltb_irrefl. reflexivity.
Qed.

Fixpoint retry_occupy (n N : nat) (r : Ring) : option Ring :=
  match n with
  | 0 => None
  | S n' =>
      match try_occupy N r with
      | Some r' => Some r'
      | None => retry_occupy n' N r
      end
  end.

(** For every candidate bound n, n retries on a full ring still fail.
    A blocking enqueue therefore has no wait-free bound while the
    consumer does not run. *)
Theorem blocking_enqueue_misses_every_bound :
  forall n N, retry_occupy n N (full N) = None.
Proof.
  induction n; intros N; simpl.
  - reflexivity.
  - rewrite occupy_full_none. apply IHn.
Qed.
