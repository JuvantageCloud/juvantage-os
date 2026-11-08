(**
  Instruction model of Theorem A.4.

  A guest program emits public values, constants, sealed secrets, or a
  plaintext secret. The host observation drops sealed payloads.

  Checked claim: every program with no EmitSecret instruction has a low
  view determined by public_intent, including concatenations of such
  programs. A program that emits the secret is not noninterfering.
  Sealed payloads do not appear in the observation.

  Not checked: macOS process isolation, Electron, or that any binary
  only runs compliant programs. A-ASLR-OS is not an assumption of this
  file; it is simply absent. The file proves the IPC-projection half only.
*)

From Stdlib Require Import List Arith.
Import ListNotations.

Record Guest := { secret : nat; public_intent : nat }.

Inductive Instr :=
| EmitPublic
| EmitSeal
| EmitConst (c : nat)
| EmitSecret.

Inductive GMsg :=
| MLow (tag payload : nat)
| MSeal (payload : nat).

Fixpoint runp (g : Guest) (p : list Instr) : list GMsg :=
  match p with
  | [] => []
  | EmitPublic :: t => MLow 1 (public_intent g) :: runp g t
  | EmitSeal :: t => MSeal (secret g) :: runp g t
  | EmitConst c :: t => MLow 2 c :: runp g t
  | EmitSecret :: t => MLow 3 (secret g) :: runp g t
  end.

Definition obs1 (m : GMsg) : list (nat * nat) :=
  match m with
  | MLow tag payload => [(tag, payload)]
  | MSeal _ => []
  end.

Definition observe (ms : list GMsg) : list (nat * nat) := flat_map obs1 ms.

Fixpoint compliant (p : list Instr) : bool :=
  match p with
  | [] => true
  | EmitSecret :: _ => false
  | _ :: t => compliant t
  end.

Lemma observe_cons :
  forall m ms, observe (m :: ms) = obs1 m ++ observe ms.
Proof.
  intros. unfold observe. simpl. reflexivity.
Qed.

Theorem compliant_ni :
  forall p g0 g1,
    compliant p = true ->
    public_intent g0 = public_intent g1 ->
    observe (runp g0 p) = observe (runp g1 p).
Proof.
  induction p as [| instr p IH]; intros g0 g1 Hc Hp.
  - reflexivity.
  - destruct instr; simpl in Hc; cbn [runp].
    + rewrite !observe_cons. cbn [obs1 app].
      f_equal.
      * f_equal. exact Hp.
      * apply IH; assumption.
    + rewrite !observe_cons. cbn [obs1 app]. apply IH; assumption.
    + rewrite !observe_cons. cbn [obs1 app].
      f_equal. apply IH; assumption.
    + discriminate.
Qed.

Lemma compliant_app :
  forall p1 p2,
    compliant p1 = true ->
    compliant p2 = true ->
    compliant (p1 ++ p2) = true.
Proof.
  induction p1 as [| a p1 IH]; simpl; intros p2 H1 H2; auto.
  destruct a; simpl in H1; try discriminate; apply IH; assumption.
Qed.

Theorem compliant_concat_ni :
  forall p1 p2 g0 g1,
    compliant p1 = true ->
    compliant p2 = true ->
    public_intent g0 = public_intent g1 ->
    observe (runp g0 (p1 ++ p2)) = observe (runp g1 (p1 ++ p2)).
Proof.
  intros p1 p2 g0 g1 H1 H2 Hp.
  apply compliant_ni.
  - apply compliant_app; assumption.
  - exact Hp.
Qed.

(** The sealed payload is in the guest message and absent from the observation. *)
Theorem seal_hides_secret :
  forall s0 s1 p,
    observe (runp {| secret := s0; public_intent := p |} [EmitSeal]) =
    observe (runp {| secret := s1; public_intent := p |} [EmitSeal]) /\
    runp {| secret := s0; public_intent := p |} [EmitSeal] =
      [MSeal s0] /\
    runp {| secret := s1; public_intent := p |} [EmitSeal] =
      [MSeal s1].
Proof.
  intros. simpl. split. reflexivity. split; reflexivity.
Qed.

Theorem leak_not_compliant : compliant [EmitSecret] = false.
Proof. reflexivity. Qed.

Theorem leak_not_ni :
  forall s0 s1 p,
    s0 <> s1 ->
    observe (runp {| secret := s0; public_intent := p |} [EmitSecret]) <>
    observe (runp {| secret := s1; public_intent := p |} [EmitSecret]).
Proof.
  intros s0 s1 p Hne E.
  simpl in E.
  congruence.
Qed.
