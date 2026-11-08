----------------------------- MODULE MemoryNI -----------------------------
(***************************************************************************
 Conf-NI sketches:
   - WasmJS: adversary can ReadMem ⇒ secrets distinguishable (Thm A.1)
   - ProcIso: renderer only sees LowMsg ⇒ conf-NI (Thm A.4)
 ***************************************************************************)
EXTENDS Integers, Sequences, TLC

CONSTANTS Secrets  \* {s0, s1}

VARIABLES secret,      \* current high secret in guest
          wasmBuf,     \* if TRUE, host shares linear memory
          advView,     \* what adversary last read
          lowTrace     \* sequence of low messages

vars == <<secret, wasmBuf, advView, lowTrace>>

InitWasm ==
  /\ secret \in Secrets
  /\ wasmBuf = TRUE
  /\ advView = "none"
  /\ lowTrace = <<>>

InitProc ==
  /\ secret \in Secrets
  /\ wasmBuf = FALSE
  /\ advView = "none"
  /\ lowTrace = <<>>

\* Hostile host reads linear memory
ReadMem ==
  /\ wasmBuf = TRUE
  /\ advView' = secret
  /\ UNCHANGED <<secret, wasmBuf, lowTrace>>

\* Process-isolated: only low IPC
SendLow ==
  /\ lowTrace' = Append(lowTrace, "draw")
  /\ UNCHANGED <<secret, wasmBuf, advView>>

NextWasm == ReadMem \/ SendLow
NextProc == SendLow

\* In WasmJS, adversary can learn secret
WasmLeakPossible == wasmBuf = TRUE /\ advView \in Secrets

\* In ProcIso, advView never becomes secret
ProcConfNI == wasmBuf = FALSE => advView = "none"

SpecWasm == InitWasm /\ [][NextWasm]_vars
SpecProc == InitProc /\ [][NextProc]_vars

THEOREM SpecProc => []ProcConfNI
=============================================================================
