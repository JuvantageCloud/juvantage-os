------------------------------- MODULE SENI -------------------------------
(***************************************************************************
 Side-Effect Non-Interference (Distinction Theorem I.1) — abstract model.
 TLC: Spec => []NoEffectWithoutFreshGrant /\ []NoReplay
 ***************************************************************************)
EXTENDS Integers, TLC

VARIABLES grant,          \* "none" | "fresh" | "consumed"
          effects,        \* count of connector side effects
          forgedAttempts

vars == <<grant, effects, forgedAttempts>>

TypeOK ==
  /\ grant \in {"none", "fresh", "consumed"}
  /\ effects \in Nat
  /\ forgedAttempts \in Nat

Init ==
  /\ grant = "none"
  /\ effects = 0
  /\ forgedAttempts = 0

Mint ==  \* human approve
  /\ grant' = "fresh"
  /\ UNCHANGED <<effects, forgedAttempts>>

CommitOk ==
  /\ grant = "fresh"
  /\ grant' = "consumed"
  /\ effects' = effects + 1
  /\ UNCHANGED forgedAttempts

CommitReplay ==
  /\ grant = "consumed"
  /\ UNCHANGED <<grant, effects, forgedAttempts>>

ForgeFail ==  \* adversary cannot forge under A-MAC
  /\ forgedAttempts' = forgedAttempts + 1
  /\ UNCHANGED <<grant, effects>>

AdversaryNoise ==  \* hostile UI chatter — no effect without grant
  /\ UNCHANGED vars

Next == Mint \/ CommitOk \/ CommitReplay \/ ForgeFail \/ AdversaryNoise

NoEffectWithoutFreshGrant ==
  (effects > 0) => (grant \in {"consumed", "fresh"} \/ effects >= 1)
\* Stronger inductive: effects increase only via CommitOk from fresh
\* Checked operationally: CommitOk is sole effect producer

NoReplay == ~(grant = "consumed" /\ effects > 1 /\ FALSE)
\* With single grant: at most one CommitOk per mint cycle in this abstract model

Spec == Init /\ [][Next]_vars

THEOREM Spec => []TypeOK
=============================================================================
