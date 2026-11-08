---------------------------- MODULE JuvMpscRing ----------------------------
(***************************************************************************
 Juvantage OS — Assignment 1 formal artifact
 MPSC ring: safety (no overwrite) + UI budget restoration under yield.
 Model-check with TLC: Spec => []InvNoOverwrite
 ***************************************************************************)
EXTENDS Integers, TLC

CONSTANTS N, MaxInject
ASSUME N \in Nat /\ N >= 2

VARIABLES head, tail, uiBudget, injectCount

vars == <<head, tail, uiBudget, injectCount>>

TypeOK ==
  /\ head \in Nat
  /\ tail \in Nat
  /\ uiBudget \in Nat
  /\ injectCount \in Nat

Init ==
  /\ head = 0
  /\ tail = 0
  /\ uiBudget = 100
  /\ injectCount = 0

Occupy ==
  /\ injectCount < MaxInject
  /\ (tail - head) < N
  /\ tail' = tail + 1
  /\ injectCount' = injectCount + 1
  /\ UNCHANGED <<head, uiBudget>>

Consume ==
  /\ head < tail
  /\ head' = head + 1
  /\ UNCHANGED <<tail, uiBudget, injectCount>>

HostUI ==
  /\ uiBudget > 0
  /\ uiBudget' = uiBudget - 1
  /\ UNCHANGED <<head, tail, injectCount>>

YieldRestore ==
  /\ uiBudget' = 100
  /\ UNCHANGED <<head, tail, injectCount>>

Next == Occupy \/ Consume \/ HostUI \/ YieldRestore

InvNoOverwrite == (tail - head) <= N

Spec ==
  /\ Init
  /\ [][Next]_vars
  /\ WF_vars(Consume)
  /\ WF_vars(YieldRestore)

THEOREM Spec => []InvNoOverwrite
=============================================================================
