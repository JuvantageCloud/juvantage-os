(**
  Discrete Poisson Dark Room (Theorem B.1 integral form).

  DarkRoomEFE.md claimed ∫ λe^{-λt} L dt = L(1−e^{−λT}) but was not checked,
  and mixed a one-shot penalty with an occupation bound. DarkRoom.v checked
  fixed occupation lists only.

  This file uses a Bernoulli hazard with p = 1/2 (discrete Poisson) and
  scaled expectations (multiply by 2^T so everything stays in nat).

  Checked:
    1. Geometric sum = oneshot integral: ∑ first-arrival mass = L·(2^T − 1)
       i.e. scaled form of L(1 − 2^{−T}).
    2. Oneshot missing mass cancels to remainder L.
    3. Occupation dormancy vs rate-bounded ears crossover: ∃T. dorm > ears + C.
    4. Eyes-off does not change extrinsic given fixed ears (B.2 link).

  Not checked: ℝ analysis, Friston minimization, NCD, real λ ≠ 1/2.
*)

From Stdlib Require Import Arith Lia.

Fixpoint pow2 (n : nat) : nat :=
  match n with
  | 0 => 1
  | S n' => 2 * pow2 n'
  end.

Lemma pow2_pos : forall n, 0 < pow2 n.
Proof. induction n; simpl; lia. Qed.

Lemma pow2_ge_Sn : forall n, S n <= pow2 n.
Proof. induction n; simpl; lia. Qed.

Fixpoint geom_sum_scaled (L exp0 t : nat) : nat :=
  match t with
  | 0 => 0
  | S t' => L * pow2 exp0 + geom_sum_scaled L (S exp0) t'
  end.

Lemma geom_sum_add :
  forall L e T,
    geom_sum_scaled L e T + L * pow2 e = L * pow2 (e + T).
Proof.
  intros L e T. revert e.
  induction T as [| T IH]; intros e.
  - change (0 + L * pow2 e = L * pow2 (e + 0)).
    rewrite Nat.add_0_r. rewrite Nat.add_0_l. reflexivity.
  - cbn [geom_sum_scaled].
    pose proof (IH (S e)) as IH'.
    assert (Hlhs :
      L * pow2 e + geom_sum_scaled L (S e) T + L * pow2 e =
      geom_sum_scaled L (S e) T + L * pow2 (S e)).
    { cbn [pow2]. lia. }
    rewrite Hlhs.
    replace (e + S T) with (S e + T) by lia.
    exact IH'.
Qed.

Definition oneshot_scaled (L T : nat) : nat := L * (pow2 T - 1).

Lemma mul_pred_pow :
  forall L T, oneshot_scaled L T + L = L * pow2 T.
Proof.
  intros L T. unfold oneshot_scaled.
  pose proof (pow2_pos T) as Hp.
  rewrite <- Nat.mul_succ_r.
  replace (S (pow2 T - 1)) with (pow2 T) by lia.
  reflexivity.
Qed.

Theorem poisson_integral_discrete :
  forall L T,
    geom_sum_scaled L 0 T = oneshot_scaled L T.
Proof.
  intros L T.
  pose proof (geom_sum_add L 0 T) as H.
  cbn [pow2] in H. rewrite Nat.mul_1_r in H.
  pose proof (mul_pred_pow L T) as H2.
  apply (Nat.add_cancel_r _ _ L).
  rewrite H2. exact H.
Qed.

Theorem oneshot_remainder_is_L :
  forall L T, L * pow2 T - oneshot_scaled L T = L.
Proof.
  intros L T. pose proof (mul_pred_pow L T). lia.
Qed.

Theorem oneshot_can_exceed :
  forall L C, 0 < L -> exists T, oneshot_scaled L T > C.
Proof.
  intros L C HL. exists (S C). unfold oneshot_scaled.
  pose proof (pow2_ge_Sn (S C)) as Hge.
  assert (H1 : S C <= pow2 (S C) - 1) by lia.
  assert (H2 : S C <= L * (pow2 (S C) - 1)).
  { eapply Nat.le_trans; [exact H1|].
    rewrite <- (Nat.mul_1_l (pow2 (S C) - 1)) at 1.
    apply Nat.mul_le_mono_r. lia. }
  lia.
Qed.

Definition dorm_occ_scaled (L T : nat) : nat :=
  match T with
  | 0 => L
  | S T' => L * (T' * pow2 (S T') + 1)
  end.

Definition ears_scaled (L T : nat) : nat :=
  match T with
  | 0 => 0
  | S T' => L * (S T') * pow2 T'
  end.

Lemma dorm_minus_ears :
  forall L T',
    dorm_occ_scaled L (S (S T')) =
    ears_scaled L (S (S T')) + L * (pow2 (S T') * T' + 1).
Proof. intros L T'. cbn. lia. Qed.

Lemma gap_beats_C :
  forall L C,
    0 < L ->
    C < L * (pow2 (S (S C)) * S C + 1).
Proof.
  intros L C HL.
  set (X := pow2 (S (S C)) * S C + 1).
  assert (HX : 1 <= X) by (unfold X; lia).
  assert (Hle : X <= L * X).
  { rewrite <- (Nat.mul_1_l X) at 1. apply Nat.mul_le_mono_r. lia. }
  assert (Hlt : C < X).
  { unfold X.
    pose proof (pow2_ge_Sn (S (S C))) as Hg.
    assert (Hsmall : C < S (S (S C)) * S C + 1) by lia.
    eapply Nat.lt_le_trans; [exact Hsmall|].
    apply Nat.add_le_mono_r.
    apply Nat.mul_le_mono_r. exact Hg. }
  eapply Nat.lt_le_trans; [exact Hlt|exact Hle].
Qed.

Theorem poisson_occupation_crossover :
  forall L C, 0 < L ->
    exists T, dorm_occ_scaled L T > ears_scaled L T + C.
Proof.
  intros L C HL.
  exists (S (S (S C))).
  rewrite (dorm_minus_ears L (S C)).
  pose proof (gap_beats_C L C HL) as Hg.
  apply Nat.add_lt_mono_l. exact Hg.
Qed.

Definition extrinsic (_eyes_on : bool) (ears_cost : nat) : nat := ears_cost.

Theorem eyes_off_extrinsic_invariant :
  forall ears_cost,
    extrinsic false ears_cost = extrinsic true ears_cost.
Proof. intros. reflexivity. Qed.
