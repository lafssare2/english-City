import React, { useState } from "react";
import { DistrictId, PlayerProfile, Mission } from "../types";
import { DISTRICTS, CITY_LOCATIONS, NPCS } from "../data/initialData";
import { sound } from "../utils/audioSynthesizer";
import {
  Map,
  X,
  Navigation,
  Compass,
  Sparkles,
  Lock,
  Plane,
  Building2,
  Home,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Film,
  Trees,
  Palmtree,
  CheckCircle2,
} from "lucide-react";

interface CityMapModalProps {
  player: PlayerProfile;
  currentDistrictId: DistrictId;
  activeMission?: Mission;
  onClose: () => void;
  onFastTravel: (districtId: DistrictId) => void;
}

export const CityMapModal: React.FC<CityMapModalProps> = ({
  player,
  currentDistrictId,
  activeMission,
  onClose,
  onFastTravel,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>(currentDistrictId);
  const [searchQuery, setSearchQuery] = useState("");

  const districtObj = DISTRICTS.find((d) => d.id === selectedDistrict) || DISTRICTS[0];
  const locationsInDistrict = CITY_LOCATIONS.filter((l) => l.districtId === selectedDistrict);
  const npcsInDistrict = NPCS.filter((n) => n.districtId === selectedDistrict);

  const getDistrictIcon = (id: DistrictId) => {
    switch (id) {
      case "transportation":
        return <Plane className="w-5 h-5" />;
      case "downtown":
        return <Building2 className="w-5 h-5" />;
      case "residential":
        return <Home className="w-5 h-5" />;
      case "shopping":
        return <ShoppingBag className="w-5 h-5" />;
      case "business":
        return <Briefcase className="w-5 h-5" />;
      case "university":
        return <GraduationCap className="w-5 h-5" />;
      case "medical":
        return <HeartPulse className="w-5 h-5" />;
      case "entertainment":
        return <Film className="w-5 h-5" />;
      case "suburbs":
        return <Trees className="w-5 h-5" />;
      case "tourist":
        return <Compass className="w-5 h-5" />;
      case "beach":
        return <Palmtree className="w-5 h-5" />;
      default:
        return <Compass className="w-5 h-5" />;
    }
  };

  const handleTravel = (id: DistrictId) => {
    sound.playTransitChime();
    onFastTravel(id);
    onClose();
  };

  const filteredDistricts = DISTRICTS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.arabicName.includes(searchQuery) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Map className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Metropolitan Map & Fast Travel</span>
                <span className="text-xs font-arabic text-amber-300">
                  (خريطة المدينة والتنقل السريع)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore all 11 city districts, active mission pins, and stationed English tutors.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left Grid / Right Detail Sheet */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left: District Cards Grid */}
          <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto flex flex-col gap-3 bg-slate-950/40">
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search districts, locations, or keywords..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none mb-1"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredDistricts.map((d) => {
                const isSelected = selectedDistrict === d.id;
                const isCurrent = currentDistrictId === d.id;
                const hasActiveMission = activeMission?.districtId === d.id;

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedDistrict(d.id);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "bg-slate-850 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    {/* Active Mission or Current Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
                        style={{ backgroundColor: d.color }}
                      >
                        {getDistrictIcon(d.id)}
                      </div>

                      <div className="flex items-center gap-1">
                        {isCurrent && (
                          <span className="text-[9px] bg-blue-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                            YOU ARE HERE
                          </span>
                        )}
                        {hasActiveMission && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse">
                            QUEST TARGET
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-display font-bold text-sm text-white">
                        {d.name}
                      </span>
                      <span className="text-[11px] font-arabic text-amber-300/90">
                        {d.arabicName}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {d.tagline}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                      <span>CEFR {d.minLevel}+</span>
                      <span className="text-blue-400 font-semibold">Inspect</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed District Panel & Fast Travel Action */}
          <div className="lg:col-span-5 p-6 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-4">
              {/* District Banner Card */}
              <div
                className="rounded-2xl p-5 border border-slate-700 text-white shadow-xl relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${districtObj.color}40, #0f172a 80%)`,
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Selected Destination
                </span>
                <h3 className="font-display font-black text-2xl text-white mt-1">
                  {districtObj.name}
                </h3>
                <p className="text-xs font-arabic text-amber-200 mt-0.5">
                  {districtObj.arabicName}
                </p>
                <p className="text-xs text-slate-200/90 mt-2 leading-relaxed">
                  {districtObj.description}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ambiance: {districtObj.atmosphere}</span>
                </div>
              </div>

              {/* District Key Locations */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Key Locations ({locationsInDistrict.length})
                </h4>
                <div className="flex flex-col gap-1.5">
                  {locationsInDistrict.map((loc) => (
                    <div
                      key={loc.id}
                      className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📍</span>
                        <span className="font-semibold text-slate-200">{loc.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {loc.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stationed NPCs */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Resident NPCs ({npcsInDistrict.length})
                </h4>
                <div className="flex flex-col gap-1.5">
                  {npcsInDistrict.map((npc) => (
                    <div
                      key={npc.id}
                      className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{npc.avatarEmoji}</span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{npc.name}</span>
                          <span className="text-[10px] text-slate-400">{npc.occupation}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-rose-300">{npc.relationshipTier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fast Travel Button */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              {currentDistrictId === districtObj.id ? (
                <div className="w-full bg-slate-800/80 text-slate-400 font-semibold py-3 rounded-2xl text-xs text-center">
                  You are already in {districtObj.name}
                </div>
              ) : (
                <button
                  id="btn_fast_travel_confirm"
                  onClick={() => handleTravel(districtObj.id)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Take Yellow Taxi to {districtObj.name}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
