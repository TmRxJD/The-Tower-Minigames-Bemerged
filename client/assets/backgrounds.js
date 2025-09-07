// BACKGROUNDS map and background helper utilities
import AlienShip from '/assets/backgrounds/AlienShip_channel.png';
import Aurora from '/assets/backgrounds/Aurora_channel.png';
import Autumn from '/assets/backgrounds/Autumn_channel.png';
import BlueCircuit from '/assets/backgrounds/BlueCircuit.png';
import CherryBlossom from '/assets/backgrounds/CherryBlossom_channel.png';
import CherryBlossomTop from '/assets/backgrounds/CherryBlossomTop.png';
import ClockTower from '/assets/backgrounds/ClockTower.png';
import Cobweb from '/assets/backgrounds/Cobweb_channel.png';
import Cthulhu from '/assets/backgrounds/Cthulhu.png';
import DarkBeing from '/assets/backgrounds/DarkBeing.png';
import DarkStrands from '/assets/backgrounds/DarkStrands_channel.png';
import DeepBlueSea from '/assets/backgrounds/DeepBlueSea_channel.png';
import FasterThanLight from '/assets/backgrounds/FasterThanLight_channel.png';
import ForestOfCats from '/assets/backgrounds/ForestOfCats.png';
import Golden from '/assets/backgrounds/Golden_channel.png';
import Guilds from '/assets/backgrounds/Guilds.png';
import Halloween from '/assets/backgrounds/Halloween_channel.png';
import Honeycomb from '/assets/backgrounds/Honeycomb_channel.png';
import Honeymask from '/assets/backgrounds/Honeymask.png';
import HowlingWolf from '/assets/backgrounds/HowlingWolf_channel.png';
import HowlingWolf2 from '/assets/backgrounds/HowlingWolf2_channel.png';
import IntoTheStorm from '/assets/backgrounds/IntoTheStorm_channel.png';
import Invaders from '/assets/backgrounds/Invaders_channel.png';
import Matrix from '/assets/backgrounds/Matrix_channel.png';
import Matrix2 from '/assets/backgrounds/Matrix2_channel.png';
import Nebula from '/assets/backgrounds/Nebula.png';
import NewYears from '/assets/backgrounds/NewYears_channel.png';
import OceanNight from '/assets/backgrounds/OceanNight_channel.png';
import PerlinNoise from '/assets/backgrounds/PerlinNoise.png';
import Plasma from '/assets/backgrounds/Plasma_channel.png';
import PrismaticLines from '/assets/backgrounds/PrismaticLines_channel.png';
import Rainfall from '/assets/backgrounds/Rainfall_channel.png';
import ReptileIris from '/assets/backgrounds/ReptileIris.png';
import RetroArcade from '/assets/backgrounds/RetroArcade_channel.png';
import Retrowave from '/assets/backgrounds/Retrowave_channel.png';
import SandsOfTime from '/assets/backgrounds/SandsOfTme_channel.png';
import Stars from '/assets/backgrounds/Stars.png';
import SunsetFishing from '/assets/backgrounds/SunsetFishing_channel.png';
import Virus from '/assets/backgrounds/Virus_channel.png';

export const BACKGROUNDS = {
  AlienShip,
  Aurora,
  Autumn,
  BlueCircuit,
  CherryBlossom,
  CherryBlossomTop,
  ClockTower,
  Cobweb,
  Cthulhu,
  DarkBeing,
  DarkStrands,
  DeepBlueSea,
  FasterThanLight,
  ForestOfCats,
  Golden,
  Guilds,
  Halloween,
  Honeycomb,
  Honeymask,
  HowlingWolf,
  HowlingWolf2,
  IntoTheStorm,
  Invaders,
  Matrix,
  Matrix2,
  Nebula,
  NewYears,
  OceanNight,
  PerlinNoise,
  Plasma,
  PrismaticLines,
  Rainfall,
  ReptileIris,
  RetroArcade,
  Retrowave,
  SandsOfTime,
  Stars,
  SunsetFishing,
  Virus,
};

import { formatBackgroundDisplay } from '../utils/format.js';

export { formatBackgroundDisplay };

export function applyBackground(key) {
  try {
    if (!key) {
      document.body.style.backgroundImage = '';
      return;
    }
    const url = BACKGROUNDS[key];
    if (!url) {
      document.body.style.backgroundImage = '';
      return;
    }
    const html = document.documentElement;
    html.style.backgroundImage = `url("${url}")`;
    html.style.backgroundSize = 'cover';
    html.style.backgroundPosition = 'center center';
    html.style.backgroundRepeat = 'no-repeat';
    html.style.backgroundAttachment = 'fixed';
    html.style.backgroundColor = '#000';
    try { localStorage.setItem('background', key); } catch (e) {}
  } catch (e) {}
}

export default BACKGROUNDS;
