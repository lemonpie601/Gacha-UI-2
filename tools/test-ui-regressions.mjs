import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../extension.js", import.meta.url), "utf8");

const has = (pattern, message) => assert.match(source, pattern, message);
const lacks = (pattern, message) => assert.doesNotMatch(source, pattern, message);

has(/template:\s*"4::chibi, chibi only::, solo, Transparent background, 1\.2::full body::, shoes, standing, looking at viewer, \{appearance\}"/,
  "새 SD 기본 프롬프트를 사용해야 합니다.");
has(/const OLD_GEN_TEMPLATE = /, "기존 기본 프롬프트만 안전하게 이전해야 합니다.");

has(/let storeQueue = Promise\.resolve\(\)/, "서버 저장은 순서대로 보내야 합니다.");
has(/MARINARA\?\.storage/, "현재 Marinara 전체 페이지 확장의 전용 저장 API를 사용해야 합니다.");
has(/MARINARA\?\.extensionId/, "현재 Marinara 런타임의 확장 ID를 인식해야 합니다.");
has(/function pendingMatches\(/, "성공한 요청이 더 최신인 보류 저장을 지우면 안 됩니다.");
has(/const old = w\.sd\[card\.name\] \|\| \{\}/, "기존 SD 편집값을 먼저 읽어야 합니다.");
has(/:\s*\{ \.\.\.old, url: saved\.url, at: Date\.now\(\) \}/,
  "SD를 다시 만들 때 대사와 편집값을 보존해야 합니다.");
has(/variants:\s*\{ \.\.\.\(old\.variants \|\| \{\}\), \[variantKey\]/,
  "의상별 SD를 기존 데이터와 호환되게 저장해야 합니다.");

has(/\.ev-panel\[data-gfx-attendance\]/, "출석 스타일은 실제 출석 패널로 제한해야 합니다.");
lacks(/\$\{AT\} \.ev-title/, "일반 이벤트 제목에 출석 스타일이 새면 안 됩니다.");

has(/const MAX_STORY_CAST = 3/, "스토리 SD는 최대 3명으로 제한해야 합니다.");
has(/function storySnapshot\(/, "스토리 표시는 현재 화면 상태에서 계산해야 합니다.");
has(/const mode = choiceActive\s*\?\s*"choice"\s*:\s*cgActive\s*\?\s*"cg"/, "선택지와 CG 모드를 구분해야 합니다.");
has(/\.vn:has\(\.vn-choices:not\(\[hidden\]\)/, "선택지가 실제로 있을 때만 말랑 선택지 UI를 적용해야 합니다.");
has(/\.vn-choices[^}]*\.vn-choice[^}]*border-radius:\s*999px/s, "스토리 선택지는 말랑한 캡슐 카드여야 합니다.");
has(/\.gfx-vn-cast \.who \{[^}]*bottom:\s*0[^}]*height:\s*86%/s, "짧은 SD도 대화창 위 무대 바닥에 서야 합니다.");
has(/vn\.hasAttribute\("data-cg"\)/, "가챠 포지의 실제 CG 상태에서는 SD를 치워야 합니다.");
has(/\.gfx-vn-cast \.who \.body \{[^}]*scale:\s*var\(--hf, 1\)/s, "키 배율은 발 기준 내부 스케일로 적용해야 합니다.");

has(/\.gfx-team img:not\(\.portrait\)[^{]*\{[^}]*height:\s*100%[^}]*max-width:\s*none/s,
  "전투 진입 SD는 같은 높이 규칙을 사용해야 합니다.");
has(/\.gfx-load-host/, "로딩 화면은 게임 무대 안의 전용 호스트에 붙어야 합니다.");
has(/\[data-screen="banner"\]/, "소환 화면 전용 스타일이 있어야 합니다.");

has(/data-gfx-settings-nav/, "설정에 SD 관리 목록을 따로 제공해야 합니다.");
has(/height:\s*calc\(var\(--f, 10px\) \* 38\)/, "SD 편집 이미지를 충분히 크게 보여야 합니다.");
has(/\[\[0\.025, "볼 작게"\], \[0\.04, "보통"\], \[0\.055, "볼 크게"\]\]/,
  "볼 크기 선택은 더 작은 범위를 사용해야 합니다.");
has(/const PINCH_RETURN_MS = 420/, "볼은 짧고 부드럽게 원위치로 돌아와야 합니다.");
has(/currentDx \+= \(targetDx - currentDx\) \*/, "볼 변형은 포인터 목표를 감쇠 보간해 따라가야 합니다.");
has(/const sc = 1, W = im\.naturalWidth, Hh = im\.naturalHeight/, "로비용 스프라이트를 760px로 축소하면 안 됩니다.");
lacks(/const BAKE_H = /, "고정 베이크 높이 때문에 SD 화질이 떨어지면 안 됩니다.");

lacks(/attributeFilter:\s*\[[^\]]*"class"/, "일반 class 애니메이션 변화로 전체 화면을 다시 훑으면 안 됩니다.");
has(/function isOwnMutation\(/, "확장 자체 DOM 변경은 관찰 대상에서 제외해야 합니다.");
has(/attributeFilter:\s*\[[^\]]*"data-cg"[^\]]*"data-on"/, "CG와 배경 전환을 즉시 감지해야 합니다.");
has(/if \(root !== observed\)[\s\S]*?refresh\(\);[\s\S]*?\n\s*\}/,
  "게임 루트가 바뀔 때만 감시 루프에서 전체 갱신해야 합니다.");

has(/const DEFAULT_FLOOR = \{/, "로비 바닥 원근 기본값이 있어야 합니다.");
has(/function floorBoundsAt\(/, "사다리꼴 바닥의 깊이별 좌우 경계를 계산해야 합니다.");
has(/function clampToFloor\(/, "SD 이동 위치를 설정한 바닥 안으로 제한해야 합니다.");
has(/data-floor-handle=\"vp\"/, "배치 화면에서 소실점을 직접 움직일 수 있어야 합니다.");
has(/data-floor-line=\"far\"/, "먼 곳 이동 경계는 한 줄로 보여야 합니다.");
has(/data-floor-line=\"near\"/, "가까운 곳 이동 경계는 한 줄로 보여야 합니다.");
lacks(/\["bl", "뒤L"/, "뒤L처럼 어려운 모서리 이름을 노출하면 안 됩니다.");
has(/\.gfx-lobby\[data-edit\]\s*\{[^}]*z-index:\s*20/s, "배치 편집기는 하단 메뉴보다 앞에 있어야 합니다.");
has(/:has\(\.gfx-lobby\[data-floor-edit\]\) \.hm-dock/, "바닥 편집 중 하단 메뉴 입력을 막아야 합니다.");
lacks(/const FLOOR = \{/, "고정 직사각형 이동 범위를 사용하면 안 됩니다.");

console.log("ui regression contracts: ok");
