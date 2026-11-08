"""Assignment 2 — NCD episodic trigger (reference). V2 ambient service target."""

from __future__ import annotations

import zlib
from dataclasses import dataclass
from enum import Enum, auto


def ncd(x: bytes, y: bytes) -> float:
    cx, cy, cxy = len(zlib.compress(x)), len(zlib.compress(y)), len(zlib.compress(x + y))
    denom = max(cx, cy)
    if denom == 0:
        return 0.0
    return (cxy - min(cx, cy)) / denom


class SensorState(Enum):
    DORMANT = auto()
    BURST = auto()


@dataclass
class TriggerConfig:
    gamma: float = 0.2
    delta: float = 0.15
    idle_eyes_off_sec: float = 90.0
    min_isi_sec: float = 2.0


def decide(
    *,
    s_prev: bytes,
    s_t: bytes,
    idle_sec: float,
    interrupt_h: float,
    forced: bool,
    connector_alarm: bool,
    now: float,
    last_burst_at: float,
    cfg: TriggerConfig,
) -> SensorState:
    if idle_sec >= cfg.idle_eyes_off_sec and not connector_alarm and not forced:
        return SensorState.DORMANT
    if forced:
        return SensorState.BURST
    # Dark room breaker: obligations without pixels
    if connector_alarm and idle_sec >= cfg.idle_eyes_off_sec:
        return SensorState.BURST
    theta = cfg.gamma + cfg.delta * interrupt_h
    if ncd(s_prev, s_t) > theta and (now - last_burst_at) >= cfg.min_isi_sec:
        return SensorState.BURST
    return SensorState.DORMANT
