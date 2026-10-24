# Lobby SD Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로비 SD 표시·화질을 복구하고 볼 당김과 원근 바닥 편집을 부드럽고 직관적으로 만든다.

**Architecture:** 기존 단일 `extension.js` 구조를 유지한다. 원본 크기 베이크, 감쇠 보간 기반 Canvas 변형, 선 기반 바닥 편집을 각각 회귀 계약으로 고정한다.

**Tech Stack:** 브라우저 JavaScript, Canvas 2D, CSS, Node 정적 회귀 테스트

**Spec:** `docs/superpowers/specs/2026-10-24-lobby-polish-design.md`

## Global Constraints

- 개인 확장만 수정하고 마리나라·가챠포지 본체는 수정하지 않는다.
- 기존 저장 데이터 형식을 호환한다.
- 외부 의존성과 빌드 단계를 추가하지 않는다.

## Review Focus

- 저장된 좌표가 NaN·범위 밖이어도 SD가 바닥 안에 보여야 한다.
- 고해상도·세로형 SD를 베이크할 때 축소하지 않아야 한다.
- 빠른 포인터 이동에서 당김 프레임이 튀지 않아야 한다.
- 놓기와 pointercancel 모두 원본 이미지를 복구해야 한다.
- 하단 메뉴 위에서도 가까운 선 손잡이를 잡을 수 있어야 한다.

---

### Task 1: 로비 표시와 원본 화질

**Files:**
- Modify: `extension.js`
- Test: `tools/test-ui-regressions.mjs`

**Interfaces:**
- Produces: `bakeNow(url)` 원본 크기 결과, `homeCast()`의 안전한 표시 좌표

- [ ] 축소 상수와 빈 로비 회귀 계약을 추가하고 실패를 확인한다.
- [ ] 원본 크기 베이크와 좌표 복구를 구현한다.
- [ ] 회귀 테스트와 `node --check extension.js`를 통과시킨다.

### Task 2: 말랑 젤리 볼 당김

**Files:**
- Modify: `extension.js`
- Test: `tools/test-ui-regressions.mjs`

**Interfaces:**
- Produces: `startPinch(...)`의 목표/현재 변위 보간과 짧은 감쇠 스프링

- [ ] 포인터 보간·짧은 복귀 계약을 추가하고 실패를 확인한다.
- [ ] 한 rAF 루프에서 현재 변위를 목표로 감쇠시키고 420ms 안에 복귀하도록 구현한다.
- [ ] pointerup·pointercancel 정리와 전체 회귀 테스트를 확인한다.

### Task 3: 선 기반 바닥 편집

**Files:**
- Modify: `extension.js`
- Test: `tools/test-ui-regressions.mjs`
- Modify: `README.md`

**Interfaces:**
- Produces: `floorGuide(lobby)`의 `far/near` 선 및 가운데/양끝 드래그

- [ ] 기존 L/R 버튼 부재와 새 선 역할 계약을 추가하고 실패를 확인한다.
- [ ] 편집 레이어·하단 메뉴 차단·선 드래그를 구현한다.
- [ ] 문서와 버전을 갱신하고 전체 테스트를 통과시킨다.

### Task 4: 실제 화면 검증과 배포

**Files:**
- Modify: `manifest.json`

**Interfaces:**
- Consumes: Tasks 1–3의 완성된 확장

- [ ] 7860에 확장을 설치하고 로비 표시·편집·볼 당김을 확인한다.
- [ ] 정적 검사, 회귀 테스트, Git diff 검사를 새로 실행한다.
- [ ] 커밋 후 `lemonpie601/Gacha-UI-2`의 `main`에 푸시하고 원격 해시를 확인한다.

