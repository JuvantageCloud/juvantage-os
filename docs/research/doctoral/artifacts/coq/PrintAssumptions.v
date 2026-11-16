(* Re-run: rocq repl -q -batch -l PrintAssumptions.v
   from this directory, after coqc. Prints axiom dependencies.
   This file is not a proof. *)

Require Import WasmJS.
Require Import ProcIso.
Require Import SeniMachine.
Require Import DarkRoom.
Require Import OpenDoc.
Require Import MpscRing.
Require Import PoissonDarkRoom.
Require Import SdoTerminal.
Require Import SeniIdealMac.

Print Assumptions blind_schedule_ni.
Print Assumptions blind_implies_ni.
Print Assumptions export_low_agrees.
Print Assumptions read1_splits.
Print Assumptions read1_not_ni.
Print Assumptions exists_buffer_attack.
Print Assumptions high_byte_not_function_of_prefix.

Print Assumptions compliant_ni.
Print Assumptions compliant_concat_ni.
Print Assumptions seal_hides_secret.
Print Assumptions leak_not_compliant.
Print Assumptions leak_not_ni.

Print Assumptions no_mint_no_effect.
Print Assumptions at_most_one_effect.
Print Assumptions commit_second_adds_nothing.
Print Assumptions forge_rejected.
Print Assumptions expired_no_effect.
Print Assumptions stolen_once_concrete.
Print Assumptions expired_concrete.

Print Assumptions one_cycle_strict.
Print Assumptions exists_crossover.
Print Assumptions eyes_off_given_same_ears.
Print Assumptions ear_cycle_spec.
Print Assumptions dorm_cycle_spec.

Print Assumptions iii1_counterexample.
Print Assumptions iii1_no_layout_decider.
Print Assumptions geometry_does_not_determine_close.
Print Assumptions sdo_separates_layout_twins.
Print Assumptions close_ignores_box.
Print Assumptions box_change_same_close.
Print Assumptions same_required_set.

Print Assumptions no_overwrite.
Print Assumptions try_occupy_decides.
Print Assumptions occupy_enabled.
Print Assumptions blocking_enqueue_misses_every_bound.

Print Assumptions poisson_integral_discrete.
Print Assumptions oneshot_remainder_is_L.
Print Assumptions oneshot_can_exceed.
Print Assumptions poisson_occupation_crossover.
Print Assumptions eyes_off_extrinsic_invariant.
Print Assumptions gap_beats_C.

Print Assumptions sdo_terminal_exists.
Print Assumptions sdo_terminal_unique.
Print Assumptions factors_through_sdo.
Print Assumptions morphisms_unique_on_sem.
Print Assumptions layout_product_close_ignores_lay.
Print Assumptions forget_is_semantic_only.

Print Assumptions verify_implies_sign.
Print Assumptions sign_injective.
Print Assumptions different_keys_different_tags.
Print Assumptions wrong_key_rejected.
Print Assumptions ideal_no_mint_no_effect.
Print Assumptions ideal_at_most_one_effect.
Print Assumptions ideal_commit_second_adds_nothing.
Print Assumptions ideal_forge_wrong_key_rejected.
Print Assumptions ideal_stolen_once_concrete.
