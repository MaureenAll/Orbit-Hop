import React, { useEffect, useRef } from 'react';
import { X, Lock, Check, Zap, Shield, Radio } from 'lucide-react';
import { SATELLITE_SKINS } from '../game/skins';
import { SatelliteSkin } from '../game/types';

interface HangarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkinId: string;
  onSelectSkin: (skin: SatelliteSkin) => void;
  lifetimeKm: number;
}

export const HangarModal: React.FC<HangarModalProps> = ({
  isOpen,
  onClose,
  selectedSkinId,
  onSelectSkin,
  lifetimeKm,
}) => {
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  // Animate rotating preview on each canvas
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    let angle = 0;

    const renderPreviews = () => {
      angle += 0.025;

      SATELLITE_SKINS.forEach((skin) => {
        const canvas = canvasRefs.current[skin.id];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(angle);

        // Draw preview thruster plume
        const flameGrad = ctx.createLinearGradient(-14, 0, -32, 0);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, skin.thrustColor);
        flameGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-14, -5);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-14, 5);
        ctx.closePath();
        ctx.fill();

        // Draw preview
        if (skin.style === 'sputnik') {
          ctx.strokeStyle = skin.wingColor;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-6, -6);
          ctx.lineTo(-30, -20);
          ctx.moveTo(-6, 6);
          ctx.lineTo(-30, 20);
          ctx.moveTo(-8, -2);
          ctx.lineTo(-36, -8);
          ctx.moveTo(-8, 2);
          ctx.lineTo(-36, 8);
          ctx.stroke();

          ctx.fillStyle = skin.bodyColor;
          ctx.strokeStyle = skin.accentColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = skin.accentColor;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (skin.style === 'solar_sail') {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
          ctx.strokeStyle = skin.wingColor;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -28);
          ctx.lineTo(20, 0);
          ctx.lineTo(0, 28);
          ctx.lineTo(-20, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = skin.bodyColor;
          ctx.strokeStyle = skin.accentColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (skin.style === 'vanguard') {
          ctx.strokeStyle = skin.wingColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(10, 0, 16, -Math.PI / 2.2, Math.PI / 2.2);
          ctx.stroke();

          ctx.fillStyle = skin.bodyColor;
          ctx.strokeStyle = skin.accentColor;
          ctx.lineWidth = 2;
          ctx.fillRect(-14, -10, 20, 20);
          ctx.strokeRect(-14, -10, 20, 20);
        } else if (skin.style === 'aegis') {
          ctx.strokeStyle = skin.wingColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = skin.bodyColor;
          ctx.strokeStyle = skin.accentColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-10, -9);
          ctx.lineTo(-8, 0);
          ctx.lineTo(-10, 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Standard CubeSat
          ctx.fillStyle = skin.wingColor;
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-36, -8, 18, 16);
          ctx.strokeRect(-36, -8, 18, 16);
          ctx.fillRect(18, -8, 18, 16);
          ctx.strokeRect(18, -8, 18, 16);

          ctx.fillStyle = skin.bodyColor;
          ctx.strokeStyle = skin.accentColor;
          ctx.lineWidth = 2;
          ctx.fillRect(-11, -11, 22, 22);
          ctx.strokeRect(-11, -11, 22, 22);

          ctx.fillStyle = skin.accentColor;
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(renderPreviews);
    };

    animId = requestAnimationFrame(renderPreviews);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              Orbital Hangar & Chassis Catalog
            </h2>
            <p className="text-xs text-slate-400">
              Lifetime Distance Traveled:{' '}
              <span className="font-mono text-cyan-300 font-semibold">{lifetimeKm.toLocaleString()} km</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chassis Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SATELLITE_SKINS.map((skin) => {
            const isUnlocked = lifetimeKm >= skin.unlockKm;
            const isSelected = selectedSkinId === skin.id;
            const progressPct = Math.min(100, Math.round((lifetimeKm / Math.max(1, skin.unlockKm)) * 100));

            return (
              <div
                key={skin.id}
                onClick={() => {
                  if (isUnlocked) onSelectSkin(skin);
                }}
                className={`relative rounded-xl p-4 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/50'
                    : isUnlocked
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-900/80 opacity-70 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-mono text-[10px] text-cyan-400 font-semibold tracking-wider">
                        {skin.codename}
                      </span>
                      <h3 className="font-bold text-white text-base">{skin.name}</h3>
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </span>
                    ) : !isUnlocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-600/30">
                        <Lock className="w-3.5 h-3.5" /> {skin.unlockKm.toLocaleString()} km
                      </span>
                    ) : null}
                  </div>

                  {/* Canvas Preview Centerpiece */}
                  <div className="w-full h-28 flex items-center justify-center bg-slate-950/70 rounded-lg border border-slate-800/80 relative mb-3">
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[skin.id] = el;
                      }}
                      width={160}
                      height={100}
                      className="w-40 h-24"
                    />
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center rounded-lg">
                        <Lock className="w-7 h-7 text-slate-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{
                          backgroundColor: skin.thrustColor,
                          boxShadow: `0 0 8px ${skin.thrustColor}`,
                        }}
                      />
                      Plasma Trail
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="capitalize text-slate-300 font-mono text-[10px]">
                      {skin.style.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{skin.lore}</p>
                </div>

                {/* Unlock progress bar or equip button */}
                <div>
                  {!isUnlocked ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Milestone Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-cyan-400"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={isSelected}
                      onClick={() => onSelectSkin(skin)}
                      className={`w-full py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-200 hover:bg-cyan-600 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Currently Equipped' : 'Equip Chassis'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
