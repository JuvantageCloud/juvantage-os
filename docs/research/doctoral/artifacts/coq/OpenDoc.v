(**
  Layout insufficiency (Theorem III.1) and the field-set fact behind C.1.

  III.1. Two documents share a box and the same ink. One box means
  Emergency, the other Tenant. The obligation ("emergency contact filled")
  holds for one and fails for the other. Every function of (box, ink)
  alone therefore returns the same bit and cannot match the obligation.

  C.1. Over arbitrary field identifiers (nats), if two requirement lists
  accept exactly the same valuations, they contain the same fields.
  The list order is not unique. Duplicate entries are not unique.
  The set of fields is.

  Not checked: a category-theoretic universal property, PDF parsers,
  or LayoutLM. "SDO adequacy" here is: the close reads role and ink,
  so it separates the two documents geometry cannot separate.
*)

From Stdlib Require Import List Arith Bool.
Import ListNotations.

(** ---------- III.1 layout counterexample ---------- *)

Inductive Role := Tenant | Emergency.

Record Doc := { role : Role; box : nat; ink : nat }.

Definition layout_view (d : Doc) : nat * nat := (box d, ink d).

Definition obligation_met (d : Doc) : bool :=
  match role d with
  | Emergency => Nat.eqb (ink d) 1
  | Tenant => false
  end.

Definition d_em : Doc := {| role := Emergency; box := 0; ink := 1 |}.
Definition d_tn : Doc := {| role := Tenant; box := 0; ink := 1 |}.

Theorem iii1_counterexample :
  layout_view d_em = layout_view d_tn /\
  obligation_met d_em = true /\
  obligation_met d_tn = false.
Proof.
  unfold d_em, d_tn, layout_view, obligation_met. simpl.
  repeat split; reflexivity.
Qed.

Theorem iii1_no_layout_decider :
  forall decide : (nat * nat) -> bool,
    ~ (forall d, decide (layout_view d) = obligation_met d).
Proof.
  intros decide H.
  destruct iii1_counterexample as [Hlay [Hem Htn]].
  specialize (H d_em) as He.
  specialize (H d_tn) as Ht.
  rewrite Hlay in He.
  rewrite Hem in He. rewrite Htn in Ht.
  rewrite He in Ht. discriminate.
Qed.

Theorem geometry_does_not_determine_close :
  exists d1 d2,
    layout_view d1 = layout_view d2 /\
    obligation_met d1 <> obligation_met d2.
Proof.
  exists d_em, d_tn.
  destruct iii1_counterexample as [Hlay [Hem Htn]].
  split. exact Hlay. rewrite Hem, Htn. discriminate.
Qed.

(** Close that reads the role separates the pair. Box is not consulted. *)
Definition sdo_close (d : Doc) : bool := obligation_met d.

Theorem sdo_separates_layout_twins :
  sdo_close d_em = true /\
  sdo_close d_tn = false /\
  layout_view d_em = layout_view d_tn.
Proof.
  destruct iii1_counterexample as [Hlay [Hem Htn]].
  split. exact Hem. split. exact Htn. exact Hlay.
Qed.

Theorem close_ignores_box :
  forall d1 d2,
    role d1 = role d2 ->
    ink d1 = ink d2 ->
    obligation_met d1 = obligation_met d2.
Proof.
  intros d1 d2 Hr Hi. unfold obligation_met. rewrite Hr, Hi. reflexivity.
Qed.

Theorem box_change_same_close :
  obligation_met {| role := Emergency; box := 0; ink := 1 |} =
  obligation_met {| role := Emergency; box := 9; ink := 1 |}.
Proof. reflexivity. Qed.

(** ---------- C.1 required-field set ---------- *)

Definition Field := nat.
Definition Val := Field -> bool.

Fixpoint forallb_fields (req : list Field) (v : Val) : bool :=
  match req with
  | [] => true
  | f :: t => (v f && forallb_fields t v)%bool
  end.

Definition v_except (f g : Field) : bool :=
  if Nat.eqb g f then false else true.

Lemma forallb_hit_false :
  forall req v f, In f req -> v f = false -> forallb_fields req v = false.
Proof.
  induction req as [| a req IH]; simpl; intros v f Hin Hv.
  - contradiction.
  - destruct Hin as [Heq | Hin].
    + subst a. rewrite Hv. reflexivity.
    + specialize (IH v f Hin Hv).
      rewrite IH. destruct (v a); reflexivity.
Qed.

Lemma forallb_true_of_all :
  forall req v,
    (forall f, In f req -> v f = true) ->
    forallb_fields req v = true.
Proof.
  induction req as [| a req IH]; simpl; intros v Hall.
  - reflexivity.
  - rewrite Hall by (left; reflexivity). simpl.
    apply IH. intros f Hf. apply Hall. right. exact Hf.
Qed.

Lemma forallb_false_exists :
  forall req v, forallb_fields req v = false -> exists f, In f req /\ v f = false.
Proof.
  induction req as [| a req IH]; simpl; intros v H.
  - discriminate.
  - destruct (v a) eqn:Va.
    + simpl in H.
      destruct (IH v H) as [f [Hin Hv]].
      exists f. split. right. exact Hin. exact Hv.
    + exists a. split. left. reflexivity. exact Va.
Qed.

Lemma only_f_false :
  forall f g, v_except f g = false -> g = f.
Proof.
  intros f g H. unfold v_except in H.
  destruct (Nat.eqb g f) eqn:E.
  - apply Nat.eqb_eq. exact E.
  - discriminate.
Qed.

Lemma v_except_self : forall f, v_except f f = false.
Proof.
  intro f. unfold v_except. rewrite Nat.eqb_refl. reflexivity.
Qed.

Lemma subset_required :
  forall r1 r2,
    (forall v, forallb_fields r1 v = forallb_fields r2 v) ->
    forall f, In f r1 -> In f r2.
Proof.
  intros r1 r2 Hagree f Hin.
  assert (Hf : forallb_fields r1 (v_except f) = false).
  { apply (forallb_hit_false r1 (v_except f) f Hin). apply v_except_self. }
  assert (H2 : forallb_fields r2 (v_except f) = false).
  { rewrite <- Hagree. exact Hf. }
  destruct (forallb_false_exists r2 (v_except f) H2) as [g [Hg Hv]].
  apply only_f_false in Hv. subst g. exact Hg.
Qed.

Theorem same_required_set :
  forall r1 r2,
    (forall v, forallb_fields r1 v = forallb_fields r2 v) ->
    forall f, In f r1 <-> In f r2.
Proof.
  intros r1 r2 H f. split.
  - apply (subset_required r1 r2 H).
  - apply subset_required. intros v. symmetry. apply H.
Qed.
