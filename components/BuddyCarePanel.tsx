"use client";

import { useState } from "react";

import BuddyAvatar from "@/components/BuddyAvatar";
import { getBuddyActionReaction } from "@/lib/buddy-action-reaction";
import type { Buddy, BuddyAction, BuddyShopItemId } from "@/lib/buddy";
import {
  applyBuddyAction,
  applyBuddyItemEffect,
  applyDailyCareBonus,
  buyBuddyItem,
  claimMiniGameReward,
  equipBuddyRoomItem,
  getBuddyLevel,
  getBuddyMood,
  MINI_GAME_REWARD,
  ROOM_ITEMS,
  SHOP_ITEMS,
} from "@/lib/buddy";

type BuddyCarePanelProps = {
  actionImagesMessage?: string;
  buddy: Buddy;
  onChange: (buddy: Buddy) => void;
  onReset: () => void;
  returnMessage?: string;
  storageWarning?: string;
};

const actionLabels: Record<BuddyAction, { label: string; description: string }> = {
  pet: { label: "쓰다듬기", description: "행복도와 경험치가 조금 올라요" },
  feed: { label: "밥주기", description: "포만감을 채우고 행복도가 올라요" },
  play: { label: "놀아주기", description: "경험치가 크게 오르지만 피로를 써요" },
  rest: { label: "재우기", description: "피로를 회복해요" },
};
type BuddyView = "home" | "shop" | "decor" | "play" | "dex" | "collection" | "growth" | "settings";
const shopItemIds = Object.keys(SHOP_ITEMS) as BuddyShopItemId[];

export default function BuddyCarePanel({
  actionImagesMessage,
  buddy,
  onChange,
  onReset,
  returnMessage,
  storageWarning,
}: BuddyCarePanelProps) {
  const mood = getBuddyMood(buddy.stats);
  const { level, progress } = getBuddyLevel(buddy.stats.exp);
  const [reaction, setReaction] = useState<{
    action: BuddyAction;
    nonce: number;
  } | null>(null);
  const [dailyBonusMessage, setDailyBonusMessage] = useState("");
  const [activeView, setActiveView] = useState<BuddyView>("dex");
  const [featureMessage, setFeatureMessage] = useState("");
  const activeReaction = reaction ? getBuddyActionReaction(reaction.action) : null;
  const activeActionImageDataUrl = reaction
    ? buddy.generatedActionImages?.[reaction.action]
    : undefined;
  const idleImageDataUrl = buddy.generatedActionImages?.idle ?? buddy.generatedImageDataUrl;
  const buddyImageDataUrl = activeActionImageDataUrl ?? idleImageDataUrl;
  const careMessage =
    featureMessage ||
    dailyBonusMessage ||
    activeReaction?.message ||
    actionImagesMessage ||
    returnMessage ||
    getMoodText(mood);
  const discoveredAt = new Date(buddy.createdAt).toLocaleDateString("ko-KR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleAction = (action: BuddyAction) => {
    setReaction((currentReaction) => ({
      action,
      nonce: (currentReaction?.nonce ?? 0) + 1,
    }));
    const actionBuddy = applyBuddyAction(buddy, action);
    const dailyBonus = applyDailyCareBonus(actionBuddy);

    setDailyBonusMessage(
      dailyBonus.awarded
        ? `오늘 첫 돌봄 보너스 +${dailyBonus.bonusExp} EXP, ${dailyBonus.streak}일째 만나는 중이에요.`
        : "",
    );
    onChange(dailyBonus.buddy);
  };

  const handleBuyItem = (itemId: BuddyShopItemId) => {
    const result = buyBuddyItem(buddy, itemId);
    setFeatureMessage(result.message);

    if (result.ok) {
      onChange(result.buddy);
    }
  };

  const handleEquipRoomItem = (itemId: BuddyShopItemId) => {
    const result = equipBuddyRoomItem(buddy, itemId);
    setFeatureMessage(result.message);

    if (result.ok) {
      onChange(result.buddy);
    }
  };

  const handleUseItem = (itemId: BuddyShopItemId) => {
    const result = applyBuddyItemEffect(buddy, itemId);
    setFeatureMessage(result.message);

    if (result.ok) {
      onChange(result.buddy);
    }
  };

  const handleMiniGameReward = () => {
    const result = claimMiniGameReward(buddy);
    setFeatureMessage(result.message);
    onChange(result.buddy);
  };

  return (
    <main className="retro-page">
      <section className="retro-profile-app">
        <header className="retro-topbar">
          <button
            aria-label="처음부터 다시 만들기"
            className="retro-back-button"
            onClick={onReset}
            type="button"
          >
            &lt;
          </button>
          <div className="retro-title">
            <span aria-hidden="true" className="retro-title-mark" />
            <strong>도감</strong>
            <span aria-hidden="true" className="retro-title-mark" />
          </div>
          <div className="retro-heart-pill">♡ {buddy.stats.affection}</div>
        </header>

        <nav className="retro-tabs" aria-label="도감 메뉴">
          <button
            className={activeView === "dex" ? "is-active" : ""}
            onClick={() => setActiveView("dex")}
            type="button"
          >
            프로필
          </button>
          <button
            className={activeView === "collection" ? "is-active" : ""}
            onClick={() => setActiveView("collection")}
            type="button"
          >
            수집
          </button>
          <button
            className={activeView === "growth" ? "is-active" : ""}
            onClick={() => setActiveView("growth")}
            type="button"
          >
            성장기록
          </button>
        </nav>

        <section className="retro-profile-panel">
          <div className="retro-crt-device">
            <div className="retro-crt-screen">
              <div className="retro-crt-hud">
                <span>Lv.{level.toString().padStart(2, "0")}</span>
                <span>♡ {buddy.stats.affection}</span>
              </div>
              <div className="retro-buddy-stage">
                {activeReaction ? (
                  <span
                    aria-hidden="true"
                    className="buddy-reaction-badge retro-reaction-badge"
                    key={`${reaction?.action}-${reaction?.nonce}-badge`}
                  >
                    {activeReaction.symbol}
                  </span>
                ) : null}
                {buddyImageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${buddy.name} 버디`}
                    className={`buddy-float retro-buddy-image ${activeReaction?.animationClassName ?? ""}`}
                    key={reaction?.nonce ?? "generated-buddy"}
                    src={buddyImageDataUrl}
                  />
                ) : (
                  <div
                    className={`buddy-float retro-buddy-svg ${activeReaction?.animationClassName ?? ""}`}
                    key={reaction?.nonce ?? "svg-buddy"}
                  >
                    <BuddyAvatar mood={mood} profile={buddy.avatarProfile} size="lg" />
                  </div>
                )}
              </div>
              <div className="retro-mini-bars">
                <MiniStat tone="pink" value={buddy.stats.hunger} />
                <MiniStat tone="green" value={buddy.stats.affection} />
                <MiniStat tone="blue" value={buddy.stats.energy} />
              </div>
            </div>
          </div>

          <aside className="retro-card retro-bio-card">
            <div className="retro-bio-heading">
              <h1>{buddy.name}</h1>
              <span>수정</span>
            </div>
            <dl className="retro-bio-grid">
              <dt>종류</dt>
              <dd>{buddy.avatarProfile.displayLabel ?? "다마고치 스타일"}</dd>
              <dt>성격</dt>
              <dd>다정하고 호기심 많음</dd>
              <dt>발견일</dt>
              <dd>{discoveredAt}</dd>
            </dl>
            <div className="retro-divider" />
            <Status label="행복도" tone="rose" value={buddy.stats.affection} />
            <Status label="포만감" tone="amber" value={buddy.stats.hunger} />
            <Status label="기운" tone="sky" value={buddy.stats.energy} />
            <div className="retro-level-row">
              <span>Lv.{level.toString().padStart(2, "0")}</span>
              <div className="retro-progress-track">
                <div style={{ width: `${progress}%` }} />
              </div>
            </div>
          </aside>
        </section>

        <p aria-live="polite" className="retro-message">
          {careMessage}
        </p>

        {storageWarning ? (
          <p className="retro-alert retro-alert-warn">{storageWarning}</p>
        ) : null}

        {activeView === "shop" ? (
          <ShopPanel buddy={buddy} onBuy={handleBuyItem} onUse={handleUseItem} />
        ) : null}

        {activeView === "decor" ? (
          <DecorPanel buddy={buddy} idleImageDataUrl={idleImageDataUrl} onEquip={handleEquipRoomItem} />
        ) : null}

        {activeView === "play" ? (
          <PlayPanel onReward={handleMiniGameReward} />
        ) : null}

        {activeView === "home" || activeView === "dex" ? (
          <DexPanel
            buddy={buddy}
            idleImageDataUrl={idleImageDataUrl}
            onAction={handleAction}
          />
        ) : null}

        {activeView === "growth" ? (
          <GrowthPanel buddy={buddy} idleImageDataUrl={idleImageDataUrl} />
        ) : null}

        {activeView === "collection" ? (
          <CollectionPanel buddy={buddy} idleImageDataUrl={idleImageDataUrl} level={level} />
        ) : null}

        {activeView === "settings" ? (
          <section className="retro-card retro-collection-card">
            <h2>설정</h2>
            <button className="retro-action-card" onClick={onReset} type="button">
              <span>새 버디 만들기</span>
              <small>현재 버디를 지우고 처음 화면으로 돌아가요.</small>
            </button>
          </section>
        ) : null}

        <nav className="retro-bottom-nav" aria-label="하단 메뉴">
          <NavButton active={activeView === "home"} label="홈" onClick={() => setActiveView("home")} />
          <NavButton active={activeView === "shop"} label="상점" onClick={() => setActiveView("shop")} />
          <NavButton active={activeView === "decor"} label="꾸미기" onClick={() => setActiveView("decor")} />
          <NavButton active={activeView === "play"} label="놀이" onClick={() => setActiveView("play")} />
          <NavButton
            active={activeView === "dex" || activeView === "collection" || activeView === "growth"}
            label="도감"
            onClick={() => setActiveView("dex")}
          />
          <NavButton active={activeView === "settings"} label="설정" onClick={() => setActiveView("settings")} />
          <span className="retro-coin">{buddy.coins}</span>
        </nav>
      </section>
    </main>
  );
}

function NavButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "is-active" : ""} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function DexPanel({
  buddy,
  idleImageDataUrl,
  onAction,
}: {
  buddy: Buddy;
  idleImageDataUrl?: string;
  onAction: (action: BuddyAction) => void;
}) {
  return (
    <>
      <GrowthPanel buddy={buddy} idleImageDataUrl={idleImageDataUrl} />
      <section className="retro-grid-panels">
        <div className="retro-card">
          <h2>도감 정보</h2>
          <dl className="retro-info-list">
            <dt>발견 장소</dt>
            <dd>우리집 거실</dd>
            <dt>연속 돌봄</dt>
            <dd>{buddy.dailyCareStreak}일</dd>
            <dt>보유 코인</dt>
            <dd>{buddy.coins}</dd>
            <dt>좋아하는 것</dt>
            <dd>간식, 공, 쓰다듬기</dd>
            <dt>특징</dt>
            <dd>말랑말랑하고 호기심이 많은 작은 친구예요.</dd>
          </dl>
        </div>

        <div className="retro-card">
          <h2>돌봄 메뉴</h2>
          <div className="retro-action-grid">
            {(Object.keys(actionLabels) as BuddyAction[]).map((action) => (
              <button
                className="retro-action-card"
                key={action}
                onClick={() => onAction(action)}
                type="button"
              >
                <span>{actionLabels[action].label}</span>
                <small>{actionLabels[action].description}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
      <CollectionPanel buddy={buddy} idleImageDataUrl={idleImageDataUrl} level={getBuddyLevel(buddy.stats.exp).level} />
    </>
  );
}

function GrowthPanel({ buddy, idleImageDataUrl }: { buddy: Buddy; idleImageDataUrl?: string }) {
  return (
    <section className="retro-card retro-growth-card">
      <h2>성장 단계</h2>
      <div className="retro-flow">
        <FlowStep active image={idleImageDataUrl} label="홈(상태)" />
        <FlowStep image={buddy.generatedActionImages?.feed} label="밥주기" />
        <FlowStep image={buddy.generatedActionImages?.play} label="놀아주기" />
        <FlowStep image={buddy.generatedActionImages?.rest} label="잠자기" />
        <FlowStep label="성장 완료" />
      </div>
    </section>
  );
}

function CollectionPanel({
  buddy,
  idleImageDataUrl,
  level,
}: {
  buddy: Buddy;
  idleImageDataUrl?: string;
  level: number;
}) {
  const ownedItemCount = Object.values(buddy.inventory).reduce((total, count) => total + (count ?? 0), 0);

  return (
    <section className="retro-card retro-collection-card">
      <div className="retro-section-head">
        <h2>다마고치 컬렉션</h2>
        <span>보유 {ownedItemCount + 1} / 8</span>
      </div>
      <div className="retro-collection-row">
        <CollectionTile active image={idleImageDataUrl} label={buddy.name} level={level} />
        <CollectionTile
          active={!!buddy.inventory["fish-snack"]}
          label={buddy.inventory["fish-snack"] ? "생선 간식" : "???"}
        />
        <CollectionTile
          active={!!buddy.inventory["pink-rug"]}
          label={buddy.inventory["pink-rug"] ? "핑크 러그" : "???"}
        />
        <CollectionTile
          active={!!buddy.inventory["beach-ball"]}
          label={buddy.inventory["beach-ball"] ? "비치볼" : "???"}
        />
      </div>
    </section>
  );
}

function ShopPanel({
  buddy,
  onBuy,
  onUse,
}: {
  buddy: Buddy;
  onBuy: (itemId: BuddyShopItemId) => void;
  onUse: (itemId: BuddyShopItemId) => void;
}) {
  return (
    <section className="retro-card retro-collection-card">
      <div className="retro-section-head">
        <h2>상점</h2>
        <span>코인 {buddy.coins}</span>
      </div>
      <div className="retro-shop-grid">
        {shopItemIds.map((itemId) => {
          const item = SHOP_ITEMS[itemId];
          const ownedCount = buddy.inventory[itemId] ?? 0;

          return (
            <article className="retro-shop-card" key={itemId}>
              <div className={`retro-item-sprite is-${itemId}`} aria-hidden="true" />
              <h3>{item.label}</h3>
              <p>{item.description}</p>
              <div className="retro-shop-meta">
                <span>보유 {ownedCount}</span>
                <span>{item.price} 코인</span>
              </div>
              <span className="retro-effect-chip">{item.effectLabel}</span>
              <button
                className="retro-buy-button"
                disabled={buddy.coins < item.price}
                onClick={() => onBuy(itemId)}
                type="button"
              >
                구매
              </button>
              <button
                className="retro-use-button"
                disabled={ownedCount <= 0}
                onClick={() => onUse(itemId)}
                type="button"
              >
                {item.type === "room" ? "배치" : "사용"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DecorPanel({
  buddy,
  idleImageDataUrl,
  onEquip,
}: {
  buddy: Buddy;
  idleImageDataUrl?: string;
  onEquip: (itemId: BuddyShopItemId) => void;
}) {
  return (
    <section className="retro-card retro-collection-card">
      <div className="retro-section-head">
        <h2>꾸미기</h2>
        <span>{buddy.equippedRoomItemId ? "배치 완료" : "기본 방"}</span>
      </div>
      <div className={`retro-room-preview ${buddy.equippedRoomItemId === "pink-rug" ? "has-pink-rug" : ""}`}>
        <div className="retro-room-window" />
        <div className="retro-room-shelf" />
        <div className="retro-room-rug" />
        <div className="retro-room-buddy">
          {idleImageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${buddy.name} 버디`} src={idleImageDataUrl} />
          ) : (
            <BuddyAvatar mood={getBuddyMood(buddy.stats)} profile={buddy.avatarProfile} size="sm" />
          )}
        </div>
      </div>
      <div className="retro-action-grid">
        {ROOM_ITEMS.map((itemId) => {
          const item = SHOP_ITEMS[itemId];
          const isOwned = !!buddy.inventory[itemId];
          const isEquipped = buddy.equippedRoomItemId === itemId;

          return (
            <button
              className={`retro-action-card ${isEquipped ? "is-equipped" : ""}`}
              disabled={!isOwned}
              key={itemId}
              onClick={() => onEquip(itemId)}
              type="button"
            >
              <span>{item.label}</span>
              <small>{isOwned ? (isEquipped ? "배치 중이에요." : "방에 배치하기") : "상점에서 먼저 구매해 주세요."}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PlayPanel({ onReward }: { onReward: () => void }) {
  return (
    <section className="retro-card retro-collection-card">
      <div className="retro-section-head">
        <h2>놀이</h2>
        <span>보상 코인 +{MINI_GAME_REWARD.coins}</span>
      </div>
      <div className="retro-mini-game">
        <div className="retro-game-screen">
          <div className="retro-game-ball" />
          <div className="retro-game-snack" />
          <div className="retro-game-score">SCORE 1280</div>
        </div>
        <p>공을 받아서 버디와 놀아주세요. 지금은 한 번 누르면 보상을 받을 수 있어요.</p>
        <button className="retro-primary-button" onClick={onReward} type="button">
          공 받기
        </button>
      </div>
    </section>
  );
}

function MiniStat({ tone, value }: { tone: "blue" | "green" | "pink"; value: number }) {
  return (
    <span className={`retro-mini-stat is-${tone}`}>
      <i style={{ width: `${value}%` }} />
    </span>
  );
}

function FlowStep({
  active = false,
  image,
  label,
}: {
  active?: boolean;
  image?: string;
  label: string;
}) {
  return (
    <div className={`retro-flow-step ${active ? "is-active" : ""}`}>
      <div>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={image} />
        ) : (
          <span className="retro-placeholder">?</span>
        )}
      </div>
      <span>{label}</span>
    </div>
  );
}

function CollectionTile({
  active = false,
  image,
  label,
  level,
}: {
  active?: boolean;
  image?: string;
  label: string;
  level?: number;
}) {
  return (
    <div className={`retro-collection-tile ${active ? "is-active" : ""}`}>
      <div>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={image} />
        ) : (
          <span className="retro-placeholder">?</span>
        )}
      </div>
      <strong>{label}</strong>
      <span>{level ? `Lv.${level.toString().padStart(2, "0")}` : "???"}</span>
    </div>
  );
}

function Status({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "rose" | "amber" | "sky";
  value: number;
}) {
  const colorClassName = {
    rose: "is-rose",
    amber: "is-amber",
    sky: "is-sky",
  }[tone];

  return (
    <div className="retro-stat-row">
      <div>
        <span>{label}</span>
        <span>{value} / 100</span>
      </div>
      <div className="retro-stat-track">
        <i className={colorClassName} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function getMoodText(mood: ReturnType<typeof getBuddyMood>) {
  if (mood === "sleep") {
    return "졸려 보여요. 잠깐 쉬게 해 주세요.";
  }

  if (mood === "hungry") {
    return "배가 고픈 것 같아요.";
  }

  if (mood === "sad") {
    return "조금 외로워 보여요. 쓰다듬어 주세요.";
  }

  return "기분이 좋아 보여요.";
}
