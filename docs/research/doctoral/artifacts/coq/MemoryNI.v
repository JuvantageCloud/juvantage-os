(**
  Juvantage OS — machine-checked *models* of Theorems A.1 and A.4.

  What this file is
  -----------------
  A Coq development of two small abstract machines:

    A.1  WasmJS  — if the adversary can read linear memory, confidentiality
                   noninterference is false.
    A.4  ProcIso — if the only host-visible messages are a function of the
                   public intent (sealed payloads erased), low views do not
                   depend on the guest secret.

  What this file is not
  ---------------------
  - Not a proof of Chromium, V8, WebKit, Electron, or macOS.
  - Not a proof that any real binary implements [bridge_compliant].
  - The WebAssembly JS API fact ("Memory.buffer is an ArrayBuffer the host
    can read") is a modeling assumption, cited in the prose paper. Coq checks
    the consequence of that assumption, not the browser.

  Checker: coqc (see MACHINE_CHECK.md for the command and version).
*)

From Stdlib Require Import List.
Import ListNotations.

(** Bytes and finite linear memories (address = list index). *)
Definition Byte := nat.
Definition Mem := list Byte.

Fixpoint get (m : Mem) (a : nat) : Byte :=
  match a, m with
  | _, [] => 0
  | O, b :: _ => b
  | S n, _ :: t => get t n
  end.

(** First [k] bytes — the "low" projection if secrets live at index >= k. *)
Fixpoint prefix (k : nat) (m : Mem) : Mem :=
  match k, m with
  | O, _ => []
  | _, [] => []
  | S n, b :: t => b :: prefix n t
  end.

(** ============================================================
    A.1  WasmJS — unrestricted buffer read breaks conf-NI
    ============================================================ *)

(** Adversary observation in the standard embedding: read one byte.
    This definition *is* the model of Memory.prototype.buffer. *)
Definition adv_read (m : Mem) (a : nat) : Byte := get m a.

(** Confidentiality NI at address [a]: memories that differ at [a]
    still look the same to [obs]. *)
Definition conf_ni_at (obs : Mem -> nat -> Byte) (a : nat) : Prop :=
  forall m0 m1 : Mem, get m0 a <> get m1 a -> obs m0 a = obs m1 a.

(** Concrete counterexample memories.
    Low prefix (index 0) agrees. High byte (index 1) does not. *)
Definition m_lo : Mem := [0; 0].
Definition m_hi : Mem := [0; 1].

Lemma prefix1_agree : prefix 1 m_lo = prefix 1 m_hi.
Proof. reflexivity. Qed.

Lemma high_byte_differs : get m_lo 1 <> get m_hi 1.
Proof. simpl. discriminate. Qed.

(** Theorem A.1 — conf-NI is false for an observer who reads the buffer. *)
Theorem A1_conf_ni_impossible : ~ conf_ni_at adv_read 1.
Proof.
  intros H.
  specialize (H m_lo m_hi high_byte_differs).
  unfold adv_read in H.
  simpl in H.
  discriminate.
Qed.

(** Any observation defined exactly as [prefix k] agrees on memories
    that already agree on that prefix. This is the positive half:
    a low projection can be NI even when a high byte differs. *)
Theorem A1_low_projection_is_ni :
  forall (obs : Mem -> Mem) k m0 m1,
    (forall m, obs m = prefix k m) ->
    prefix k m0 = prefix k m1 ->
    obs m0 = obs m1.
Proof.
  intros obs k m0 m1 Hobs Hagree.
  rewrite Hobs, Hobs, Hagree.
  reflexivity.
Qed.

(** On the counterexample, the low projection agrees while the buffer read does not. *)
Theorem A1_split_low_vs_buffer :
  prefix 1 m_lo = prefix 1 m_hi /\
  adv_read m_lo 1 <> adv_read m_hi 1.
Proof.
  split.
  - apply prefix1_agree.
  - unfold adv_read. apply high_byte_differs.
Qed.

(** ============================================================
    A.4  ProcIso — typed IPC, secret not in the low view
    ============================================================ *)

Record Guest := {
  secret : nat;
  public_intent : nat
}.

Inductive LowMsg :=
| Draw (cmd : nat)
| Poll
| StageHandle (h : nat).

Inductive Ipc :=
| Low (m : LowMsg)
| Sealed.   (** host sees the tag only; payload is not in this type *)

Definition proj (i : Ipc) : option LowMsg :=
  match i with
  | Low m => Some m
  | Sealed => None
  end.

Fixpoint low_view (xs : list Ipc) : list LowMsg :=
  match xs with
  | [] => []
  | i :: t =>
      match proj i with
      | Some m => m :: low_view t
      | None => low_view t
      end
  end.

(** Compliant bridge: draw command is the public intent; anything private
    is [Sealed] and therefore erased by [low_view].
    This is an architecture *policy*. Coq does not show Electron implements it. *)
Definition bridge_compliant (g : Guest) : list Ipc :=
  [Low (Draw (public_intent g)); Sealed].

(** Leaking bridge: draw command is the secret. Used only as a negative control. *)
Definition bridge_leak (g : Guest) : list Ipc :=
  [Low (Draw (secret g))].

Definition Bridge := Guest -> list Ipc.

Definition low_determined_by_public (b : Bridge) : Prop :=
  forall g0 g1 : Guest,
    public_intent g0 = public_intent g1 ->
    low_view (b g0) = low_view (b g1).

Lemma low_view_compliant :
  forall g, low_view (bridge_compliant g) = [Draw (public_intent g)].
Proof.
  intro g. unfold low_view, bridge_compliant, proj. simpl. reflexivity.
Qed.

(** Theorem A.4 — compliant IPC low-view ignores [secret]. *)
Theorem A4_prociso_conf_ni : low_determined_by_public bridge_compliant.
Proof.
  intros g0 g1 Heq.
  rewrite !low_view_compliant.
  rewrite Heq.
  reflexivity.
Qed.

(** Same public intent, different secrets: views still agree. *)
Theorem A4_secret_irrelevant :
  forall s0 s1 p,
    low_view (bridge_compliant {| secret := s0; public_intent := p |}) =
    low_view (bridge_compliant {| secret := s1; public_intent := p |}).
Proof.
  intros. apply A4_prociso_conf_ni. reflexivity.
Qed.

(** Negative control: the leaking bridge is not NI.
    So the proof depends on the bridge, not on a vacuous definition. *)
Theorem A4_leak_is_not_ni : ~ low_determined_by_public bridge_leak.
Proof.
  intros H.
  set (g0 := {| secret := 0; public_intent := 7 |}).
  set (g1 := {| secret := 1; public_intent := 7 |}).
  assert (E : public_intent g0 = public_intent g1) by reflexivity.
  specialize (H g0 g1 E).
  unfold bridge_leak, low_view, proj, g0, g1 in H.
  simpl in H.
  discriminate.
Qed.

(** ============================================================
    SENI fragment — linear grant, one effect (companion, not Chromium)
    ============================================================ *)

Inductive Grant := Fresh | Consumed | Absent.

(** Commit succeeds only from Fresh, and moves to Consumed. *)
Definition commit (g : Grant) : option Grant :=
  match g with
  | Fresh => Some Consumed
  | _ => None
  end.

Definition effect_count (g : Grant) : nat :=
  match commit g with
  | Some _ => 1
  | None => 0
  end.

Theorem seni_no_effect_without_fresh :
  forall g, g <> Fresh -> effect_count g = 0.
Proof.
  intros g H.
  destruct g; simpl; try reflexivity.
  exfalso. apply H. reflexivity.
Qed.

Theorem seni_no_replay :
  forall g g', commit g = Some g' -> commit g' = None.
Proof.
  intros g g' Hc.
  destruct g; simpl in Hc; try discriminate.
  inversion Hc. subst. simpl. reflexivity.
Qed.
