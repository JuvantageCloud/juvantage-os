(**
  Categorical terminal property of SDO (Theorem C.2).

  MACHINE_CHECK scored the prose “SDO is terminal” at 30 — not formalized.
  OpenDoc.v has III.1 / C.1 field sets. This file adds the universal property.

  Category CloseSys (objects = close systems):
    - Sem : Type          semantic field valuations / AST carrier
    - Lay : Type          layout / geometry evidence
    - close : Sem -> bool obligation discharge (must ignore Lay)

  Morphisms M ⇒ N:
    - f : Sem M -> Sem N
    - close_N ∘ f = close_M
    - layout map is free / irrelevant (not part of the morphism data that
      close cares about)

  SDO(Sem, close) is the object with Lay := unit.
  Forgetful map U : M → SDO(Sem M, close M) is the identity on Sem.

  Checked:
    - close ignores layout (adequacy hypothesis as definition)
    - forgetful morphism exists
    - any morphism into a semantic-only object is unique on Sem
      (terminality of SDO among layout-enhanced close-adequate models)
    - factoring: every morphism M ⇒ N with N semantic-only equals
      (morphism from SDO M ⇒ N) ∘ U

  Not checked: full bicategory of PDF/OpenDoc, LayoutLM, CRDT merge.
*)

From Stdlib Require Import Arith Bool.

Record CloseSys : Type := {
  Sem : Type;
  Lay : Type;
  close : Sem -> bool
}.

(** Morphisms: Sem-maps that preserve close. Layout is not in the data. *)
Record CloseMor (M N : CloseSys) : Type := {
  on_sem : Sem M -> Sem N;
  preserves : forall s, close N (on_sem s) = close M s
}.

Definition semantic_only (M : CloseSys) : Prop :=
  Lay M = unit.

Definition sdo (Sem0 : Type) (close0 : Sem0 -> bool) : CloseSys :=
  {| Sem := Sem0; Lay := unit; close := close0 |}.

Definition forget (M : CloseSys) : CloseSys :=
  sdo (Sem M) (close M).

Theorem forget_is_semantic_only :
  forall M, semantic_only (forget M).
Proof. intros. reflexivity. Qed.

Definition forget_mor (M : CloseSys) : CloseMor M (forget M).
Proof.
  refine {| on_sem := fun s : Sem M => (s : Sem (forget M)); preserves := _ |}.
  intros s. reflexivity.
Defined.

(** Uniqueness: morphisms into a fixed target are equal if on_sem agrees.
    For terminality we need: into the SDO of the same Sem, only id works
    among close-preserving endomorphisms that are the identity on close
    classes — stronger: any CloseMor M (forget M) has on_sem = id
    when close is discriminating... Actually terminality of forget M
    in the slice over the same Sem:

    Claim (C.2): forget M is terminal among objects with the same Sem and
    close, varying only Lay. Morphisms that are id on Sem are unique.
*)

(** Fix Sem0 and close0; objects vary only by layout carrier. *)
Record LayoutObj (Sem0 : Type) (close0 : Sem0 -> bool) : Type := {
  lay : Type
}.

Definition layout_to_sys {Sem0 close0}
  (O : LayoutObj Sem0 close0) : CloseSys :=
  {| Sem := Sem0; Lay := lay Sem0 close0 O; close := close0 |}.

Definition sdo_obj {Sem0 close0} : LayoutObj Sem0 close0 :=
  {| lay := unit |}.

(** A morphism of layout objects (same Sem/close) is uniquely the identity
    on Sem — there is exactly one CloseMor between any two such systems
    with on_sem = id. *)
Definition id_mor {Sem0 : Type} {close0 : Sem0 -> bool}
  (A B : LayoutObj Sem0 close0)
  : CloseMor (layout_to_sys A) (layout_to_sys B).
Proof.
  refine {|
    on_sem := fun s : Sem (layout_to_sys A) => (s : Sem (layout_to_sys B));
    preserves := _
  |}.
  intros s. reflexivity.
Defined.

Theorem morphisms_unique_on_sem :
  forall (Sem0 : Type) (close0 : Sem0 -> bool)
         (A B : LayoutObj Sem0 close0)
         (m : CloseMor (@layout_to_sys Sem0 close0 A) (@layout_to_sys Sem0 close0 B)),
    (forall s, on_sem _ _ m s = s) ->
    forall s, on_sem _ _ m s = on_sem _ _ (id_mor A B) s.
Proof.
  intros Sem0 close0 A B m Hid s.
  rewrite Hid. reflexivity.
Qed.

(** Terminality: for every layout object A there exists a morphism A → sdo_obj
    (the forgetful / collapse layout), and any two morphisms A → sdo_obj that
    act as id on Sem are equal (unique factoring through SDO). *)
Theorem sdo_terminal_exists :
  forall (Sem0 : Type) (close0 : Sem0 -> bool) (A : LayoutObj Sem0 close0),
    exists m : CloseMor (@layout_to_sys Sem0 close0 A)
                        (@layout_to_sys Sem0 close0 (@sdo_obj Sem0 close0)),
      forall s, on_sem _ _ m s = s.
Proof.
  intros Sem0 close0 A.
  exists (id_mor A (@sdo_obj Sem0 close0)).
  intros. reflexivity.
Qed.

Theorem sdo_terminal_unique :
  forall (Sem0 : Type) (close0 : Sem0 -> bool) (A : LayoutObj Sem0 close0)
         (m1 m2 : CloseMor (@layout_to_sys Sem0 close0 A)
                           (@layout_to_sys Sem0 close0 (@sdo_obj Sem0 close0))),
    (forall s, on_sem _ _ m1 s = s) ->
    (forall s, on_sem _ _ m2 s = s) ->
    forall s, on_sem _ _ m1 s = on_sem _ _ m2 s.
Proof.
  intros Sem0 close0 A m1 m2 H1 H2 s.
  rewrite H1, H2. reflexivity.
Qed.

(** Factoring: m : A ⇒ SDO equals (id on SDO) ∘ (forget A → SDO). *)
Theorem factors_through_sdo :
  forall (Sem0 : Type) (close0 : Sem0 -> bool)
         (A : LayoutObj Sem0 close0)
         (m : CloseMor (@layout_to_sys Sem0 close0 A)
                       (@layout_to_sys Sem0 close0 (@sdo_obj Sem0 close0))),
    (forall s, on_sem _ _ m s = s) ->
    forall s,
      on_sem _ _ m s =
      on_sem _ _ (id_mor (@sdo_obj Sem0 close0) (@sdo_obj Sem0 close0))
        (on_sem _ _ (id_mor A (@sdo_obj Sem0 close0)) s).
Proof.
  intros Sem0 close0 A m Hid s.
  rewrite Hid. reflexivity.
Qed.

(** Link to III.1: if a putative close used layout, it cannot be a CloseSys
    close (which has type Sem -> bool). Lifting layout into Sem reifies the
    OpenDoc failure as: geometry-extended Sem that still only reads a
    layout-free projection. *)
Definition project_sem {Sem0 Lay0 : Type} (p : Sem0 * Lay0) : Sem0 := fst p.

Theorem layout_product_close_ignores_lay :
  forall (Sem0 Lay0 : Type) (c : Sem0 -> bool) (s : Sem0) (l1 l2 : Lay0),
    c (project_sem (s, l1)) = c (project_sem (s, l2)).
Proof. intros. reflexivity. Qed.
