(**
  Discrete Dark Room ordering (Theorem B.1, occupation form).

  One cycle has length gap + clear.
  Ears-on pays L on each of the first gap ticks (breach until detection)
  and 0 on the clear ticks (recovered).
  Dormancy pays L on every tick of the cycle (no recovery).

  The lists are the per-tick costs. The nth lemmas pin those lists to
  that schedule. The crossover theorem is the sum, plus a constant
  sampling penalty C on the ears policy: some finite number of cycles
  makes dormancy strictly more expensive.

  Not checked: the Poisson integral in DarkRoomEFE.md. That note mixes
  a one-shot exponential penalty with an occupation bound. This file
  uses occupation cost for both policies and does not use an approximation.
  Not checked: that a brain minimizes expected free energy.
*)

From Stdlib Require Import List Arith Lia.
Import ListNotations.

Fixpoint repeat (v n : nat) : list nat :=
  match n with
  | 0 => []
  | S n' => v :: repeat v n'
  end.

Fixpoint sum (xs : list nat) : nat :=
  match xs with
  | [] => 0
  | x :: t => x + sum t
  end.

Fixpoint ncopy (n : nat) (xs : list nat) : list nat :=
  match n with
  | 0 => []
  | S n' => xs ++ ncopy n' xs
  end.

Definition ear_cycle (L gap clear : nat) : list nat :=
  repeat L gap ++ repeat 0 clear.

Definition dorm_cycle (L gap clear : nat) : list nat :=
  repeat L (gap + clear).

Lemma repeat_length : forall v n, length (repeat v n) = n.
Proof.
  intros v n. induction n; simpl; auto.
Qed.

Lemma nth_repeat :
  forall v n i d, i < n -> nth i (repeat v n) d = v.
Proof.
  intros v n. induction n; intros i d Hi; simpl.
  - lia.
  - destruct i; simpl.
    + reflexivity.
    + apply IHn. lia.
Qed.

Lemma ear_cycle_spec :
  forall L gap clear i,
    i < gap + clear ->
    nth i (ear_cycle L gap clear) 0 = if i <? gap then L else 0.
Proof.
  intros L gap clear i Hi.
  unfold ear_cycle.
  destruct (i <? gap) eqn:E.
  - apply Nat.ltb_lt in E.
    rewrite app_nth1.
    + apply nth_repeat. exact E.
    + rewrite repeat_length. exact E.
  - apply Nat.ltb_ge in E.
    rewrite app_nth2.
    + rewrite repeat_length.
      apply nth_repeat. lia.
    + rewrite repeat_length. exact E.
Qed.

Lemma dorm_cycle_spec :
  forall L gap clear i,
    i < gap + clear ->
    nth i (dorm_cycle L gap clear) 0 = L.
Proof.
  intros. unfold dorm_cycle. apply nth_repeat. exact H.
Qed.

Lemma sum_repeat : forall v n, sum (repeat v n) = v * n.
Proof.
  intros v n. induction n; simpl.
  - rewrite Nat.mul_0_r. reflexivity.
  - rewrite IHn. rewrite Nat.add_comm. rewrite <- Nat.mul_succ_r. reflexivity.
Qed.

Lemma sum_app : forall a b, sum (a ++ b) = sum a + sum b.
Proof.
  intros a. induction a; simpl; intros b.
  - reflexivity.
  - rewrite IHa. rewrite Nat.add_assoc. reflexivity.
Qed.

Lemma ncopy_sum : forall xs n, sum (ncopy n xs) = n * sum xs.
Proof.
  intros xs n. induction n; simpl.
  - reflexivity.
  - rewrite sum_app. rewrite IHn. reflexivity.
Qed.

Lemma cycle_diff :
  forall L gap clear,
    sum (dorm_cycle L gap clear) =
    sum (ear_cycle L gap clear) + L * clear.
Proof.
  intros. unfold dorm_cycle, ear_cycle.
  rewrite sum_app. rewrite !sum_repeat.
  rewrite Nat.mul_0_l. rewrite Nat.add_0_r.
  apply Nat.mul_add_distr_l.
Qed.

Theorem one_cycle_strict :
  forall L gap clear,
    0 < L ->
    0 < clear ->
    sum (dorm_cycle L gap clear) > sum (ear_cycle L gap clear).
Proof.
  intros L gap clear HL HC. rewrite cycle_diff. lia.
Qed.

(** Sampling penalty C is charged to ears. Large enough n still crosses. *)
Theorem exists_crossover :
  forall L gap clear C,
    0 < L ->
    0 < clear ->
    exists n,
      sum (ncopy n (dorm_cycle L gap clear)) >
      sum (ncopy n (ear_cycle L gap clear)) + C.
Proof.
  intros L gap clear C HL HC.
  exists (S C).
  rewrite !ncopy_sum.
  rewrite cycle_diff.
  assert (Hdist : forall e, S C * (e + L * clear) = S C * e + S C * (L * clear)).
  { intro e. apply Nat.mul_add_distr_l. }
  rewrite Hdist.
  assert (H1 : 1 <= L * clear).
  { replace 1 with (1 * 1) by reflexivity. apply Nat.mul_le_mono; lia. }
  assert (H2 : S C <= S C * (L * clear)).
  { rewrite <- (Nat.mul_1_r (S C)) at 1. apply Nat.mul_le_mono_l. exact H1. }
  lia.
Qed.

(** Theorem B.2, discrete: pixel activity is not in the obligation cost,
    and leaving the eyes off does not raise that cost. *)
Definition extrinsic (_eyes_on : bool) (obl_cost : nat) : nat := obl_cost.

Definition metabolic (eyes_on : bool) : nat := if eyes_on then 1 else 0.

Theorem eyes_off_given_same_ears :
  forall obl,
    extrinsic false obl = extrinsic true obl /\
    metabolic false <= metabolic true /\
    extrinsic false obl + metabolic false <=
      extrinsic true obl + metabolic true.
Proof.
  intro obl. unfold extrinsic, metabolic. simpl. split. reflexivity. split; lia.
Qed.
