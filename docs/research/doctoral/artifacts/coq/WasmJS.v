(**
  Operational model of Theorem A.1.

  Guest: one store of a secret at address 1. Address 0 stays public.
  Host schedule: Read / Export. A schedule is 1-blind when every read
  is below address 1 and every export stops at or before address 1.

  Checked claim: every 1-blind host schedule yields the same trace for
  every secret, and the schedule [Read 1] does not.
  That is confidentiality noninterference for this machine, and its failure
  for a buffer read.

  Not checked: that a browser implements Read as
  Uint8Array(WebAssembly.Memory.prototype.buffer)[a]. That API fact is
  outside this file.
*)

From Stdlib Require Import List Arith Lia Bool.
Import ListNotations.

Definition Byte := nat.
Definition Mem := list Byte.

Fixpoint get (m : Mem) (a : nat) : Byte :=
  match a, m with
  | _, [] => 0
  | O, b :: _ => b
  | S n, _ :: t => get t n
  end.

Fixpoint prefix (k : nat) (m : Mem) : Mem :=
  match k, m with
  | O, _ => []
  | _, [] => []
  | S n, b :: t => b :: prefix n t
  end.

Fixpoint set (m : Mem) (a v : nat) : Mem :=
  match m, a with
  | [], O => [v]
  | [], S n => 0 :: set [] n v
  | _ :: t, O => v :: t
  | b :: t, S n => b :: set t n v
  end.

Inductive Step :=
| Store (addr : nat) (val : nat)
| Read (addr : nat)
| Export (k : nat).

Record St := { mem : Mem; trace : list Byte }.

Definition empty : St := {| mem := [0; 0]; trace := [] |}.

Fixpoint exec (steps : list Step) (s : St) : St :=
  match steps with
  | [] => s
  | Store a v :: rest =>
      exec rest {| mem := set (mem s) a v; trace := trace s |}
  | Read a :: rest =>
      exec rest {| mem := mem s; trace := trace s ++ [get (mem s) a] |}
  | Export k :: rest =>
      exec rest {| mem := mem s; trace := trace s ++ prefix k (mem s) |}
  end.

(** Host may read only addresses < k and export only a prefix of length <= k.
    Host stores are not blind: a store could copy a high byte downward. *)
Fixpoint blind (k : nat) (host : list Step) : bool :=
  match host with
  | [] => true
  | Store _ _ :: _ => false
  | Read a :: t => (a <? k) && blind k t
  | Export j :: t => (j <=? k) && blind k t
  end.

Lemma get0_of_prefix :
  forall m0 m1, prefix 1 m0 = prefix 1 m1 -> get m0 0 = get m1 0.
Proof.
  intros m0 m1 H.
  destruct m0 as [| a0 t0], m1 as [| a1 t1]; simpl in H; simpl.
  - reflexivity.
  - discriminate.
  - discriminate.
  - inversion H. reflexivity.
Qed.

Lemma prefix_agree_le :
  forall k m0 m1,
    k <= 1 ->
    prefix 1 m0 = prefix 1 m1 ->
    prefix k m0 = prefix k m1.
Proof.
  intros k m0 m1 Hk H.
  destruct k as [| n].
  - reflexivity.
  - assert (n = 0) by lia. subst n. exact H.
Qed.

Lemma blind_exec :
  forall host m0 m1 tr,
    blind 1 host = true ->
    prefix 1 m0 = prefix 1 m1 ->
    trace (exec host {| mem := m0; trace := tr |}) =
      trace (exec host {| mem := m1; trace := tr |})
    /\ mem (exec host {| mem := m0; trace := tr |}) = m0
    /\ mem (exec host {| mem := m1; trace := tr |}) = m1.
Proof.
  induction host as [| step host IH]; intros m0 m1 tr Hblind Hpre.
  - simpl. split. reflexivity. split; reflexivity.
  - destruct step as [addr val | addr | k].
    + simpl in Hblind. discriminate.
    + simpl in Hblind.
      apply andb_prop in Hblind. destruct Hblind as [Ha Hrest].
      apply Nat.ltb_lt in Ha.
      assert (addr = 0) by lia. subst addr.
      simpl.
      assert (Eget : get m0 0 = get m1 0) by (apply get0_of_prefix; exact Hpre).
      rewrite <- Eget.
      apply IH; assumption.
    + simpl in Hblind.
      apply andb_prop in Hblind. destruct Hblind as [Hk Hrest].
      apply Nat.leb_le in Hk.
      simpl.
      assert (Epre : prefix k m0 = prefix k m1) by (apply prefix_agree_le; assumption).
      rewrite <- Epre.
      apply IH; assumption.
Qed.

(** Positive half: a host that cannot see address >= 1 learns nothing about the secret. *)
Theorem blind_schedule_ni :
  forall host s0 s1,
    blind 1 host = true ->
    trace (exec (Store 1 s0 :: host) empty) =
    trace (exec (Store 1 s1 :: host) empty).
Proof.
  intros host s0 s1 Hblind.
  unfold empty. simpl.
  assert (Hpre : prefix 1 (set [0; 0] 1 s0) = prefix 1 (set [0; 0] 1 s1))
    by (simpl; reflexivity).
  destruct (blind_exec host (set [0; 0] 1 s0) (set [0; 0] 1 s1) [] Hblind Hpre)
    as [Ht _].
  exact Ht.
Qed.

Definition sched_ni (host : list Step) : Prop :=
  forall s0 s1,
    trace (exec (Store 1 s0 :: host) empty) =
    trace (exec (Store 1 s1 :: host) empty).

Theorem blind_implies_ni :
  forall host, blind 1 host = true -> sched_ni host.
Proof.
  intros host H s0 s1. apply blind_schedule_ni. exact H.
Qed.

(** The low export is one such schedule, so it is noninterfering. *)
Theorem export_low_agrees :
  forall s0 s1,
    trace (exec [Store 1 s0; Export 1] empty) =
    trace (exec [Store 1 s1; Export 1] empty).
Proof.
  intros. apply blind_schedule_ni. reflexivity.
Qed.

(** Negative half: reading the secret's address splits the trace. *)
Theorem read1_splits :
  forall s0 s1,
    s0 <> s1 ->
    trace (exec [Store 1 s0; Read 1] empty) <>
    trace (exec [Store 1 s1; Read 1] empty).
Proof.
  intros s0 s1 Hne E.
  unfold empty in E. simpl in E.
  congruence.
Qed.

Theorem read1_not_ni : ~ sched_ni [Read 1].
Proof.
  intro H.
  apply (read1_splits 0 1).
  - discriminate.
  - apply H.
Qed.

Theorem exists_buffer_attack :
  exists host,
    blind 1 host = false /\ ~ sched_ni host.
Proof.
  exists [Read 1]. split.
  - reflexivity.
  - apply read1_not_ni.
Qed.

(** Same low prefix, different high byte: the secret is not a function of the prefix. *)
Theorem high_byte_not_function_of_prefix :
  forall s0 s1,
    s0 <> s1 ->
    prefix 1 (set [0; 0] 1 s0) = prefix 1 (set [0; 0] 1 s1) /\
    get (set [0; 0] 1 s0) 1 <> get (set [0; 0] 1 s1) 1.
Proof.
  intros s0 s1 H. split.
  - simpl. reflexivity.
  - simpl. exact H.
Qed.
