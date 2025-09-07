// Centralized asset exports and ASSETS map.
// Keep eager imports here so the bundler includes them in the client bundle.

// Small utility: re-export a couple app-level assets
import importedMergeChart from '/assets/merge_chart.png';
import bossImg from '/assets/boss.png';
import mineAsset from '/assets/mine.png';

// Generator module assets
import gen_rare_sl from '/assets/modules_generator/rare_sl.png';
import gen_rare_sds from '/assets/modules_generator/rare_sds.png';
import gen_rare_os from '/assets/modules_generator/rare_os.png';
import gen_rare_ar from '/assets/modules_generator/rare_ar.png';
import gen_mf_rare_plus from '/assets/modules_generator/mf_rare_plus.png';
import gen_mf_rare from '/assets/modules_generator/mf_rare.png';
import gen_mf_mythic_plus from '/assets/modules_generator/mf_mythic_plus.png';
import gen_mf_mythic from '/assets/modules_generator/mf_mythic.png';
import gen_mf_legendary_plus from '/assets/modules_generator/mf_legendary_plus.png';
import gen_mf_legendary from '/assets/modules_generator/mf_legendary.png';
import gen_mf_epic_plus from '/assets/modules_generator/mf_epic_plus.png';
import gen_mf_epic from '/assets/modules_generator/mf_epic.png';
import gen_mf_empty from '/assets/modules_generator/mf_empty.png';
import gen_mf_common from '/assets/modules_generator/mf_common.png';
import gen_mf_ancestral from '/assets/modules_generator/mf_ancestral.png';
import gen_generator_type from '/assets/modules_generator/generator_type.png';
import gen_epic_sh from '/assets/modules_generator/epic_sh.png';
import gen_epic_ph from '/assets/modules_generator/epic_ph.png';
import gen_epic_gc from '/assets/modules_generator/epic_gc.png';
import gen_epic_bhd from '/assets/modules_generator/epic_bhd.png';
import gen_common_mc from '/assets/modules_generator/common_mc.png';
import gen_common_ec from '/assets/modules_generator/common_ec.png';

// Core module assets
import core_type from '/assets/modules_core/type.png';
import core_rare_ms from '/assets/modules_core/rare_ms.png';
import core_rare_gl from '/assets/modules_core/rare_gl.png';
import core_rare_em from '/assets/modules_core/rare_em.png';
import core_rare_cs from '/assets/modules_core/rare_cs.png';
import core_mf_rare_plus from '/assets/modules_core/mf_rare_plus.png';
import core_mf_rare from '/assets/modules_core/mf_rare.png';
import core_mf_mythic_plus from '/assets/modules_core/mf_mythic_plus.png';
import core_mf_mythic from '/assets/modules_core/mf_mythic.png';
import core_mf_legendary_plus from '/assets/modules_core/mf_legendary_plus.png';
import core_mf_legendary from '/assets/modules_core/mf_legendary.png';
import core_mf_epic_plus from '/assets/modules_core/mf_epic_plus.png';
import core_mf_epic from '/assets/modules_core/mf_epic.png';
import core_mf_empty from '/assets/modules_core/mf_empty.png';
import core_mf_common from '/assets/modules_core/mf_common.png';
import core_mf_ancestral from '/assets/modules_core/mf_ancestral.png';
import core_epic_oc from '/assets/modules_core/epic_oc.png';
import core_epic_mvn from '/assets/modules_core/epic_mvn.png';
import core_epic_hc from '/assets/modules_core/epic_hc.png';
import core_epic_dc from '/assets/modules_core/epic_dc.png';
import core_common_mc from '/assets/modules_core/common_mc.png';
import core_common_ec from '/assets/modules_core/common_ec.png';

// Armor module assets
import arm_rare_pc from '/assets/modules_armor/rare_pc.png';
import arm_rare_ni from '/assets/modules_armor/rare_ni.png';
import arm_rare_dn from '/assets/modules_armor/rare_dn.png';
import arm_mf_rare_plus from '/assets/modules_armor/mf_rare_plus.png';
import arm_mf_rare from '/assets/modules_armor/mf_rare.png';
import arm_mf_mythic_plus from '/assets/modules_armor/mf_mythic_plus.png';
import arm_mf_mythic from '/assets/modules_armor/mf_mythic.png';
import arm_mf_legendary_plus from '/assets/modules_armor/mf_legendary_plus.png';
import arm_mf_legendary from '/assets/modules_armor/mf_legendary.png';
import arm_rare_sr from '/assets/modules_armor/rare_sr.png';
import arm_mf_epic_plus from '/assets/modules_armor/mf_epic_plus.png';
import arm_mf_epic from '/assets/modules_armor/mf_epic.png';
import arm_mf_empty from '/assets/modules_armor/mf_empty.png';
import arm_mf_common from '/assets/modules_armor/mf_common.png';
import arm_mf_ancestral from '/assets/modules_armor/mf_ancestral.png';
import arm_epic_wr from '/assets/modules_armor/epic_wr.png';
import arm_epic_sd from '/assets/modules_armor/epic_sd.png';
import arm_epic_nmp from '/assets/modules_armor/epic_nmp.png';
import arm_epic_acp from '/assets/modules_armor/epic_acp.png';
import arm_common_mb from '/assets/modules_armor/common_mb.png';
import arm_common_eb from '/assets/modules_armor/common_eb.png';
import arm_type from '/assets/modules_armor/type.png';

// Cannon module assets
import can_mf_rare_plus from '/assets/modules_cannon/mf_rare_plus.png';
import can_mf_rare from '/assets/modules_cannon/mf_rare.png';
import can_mf_mythic_plus from '/assets/modules_cannon/mf_mythic_plus.png';
import can_mf_mythic from '/assets/modules_cannon/mf_mythic.png';
import can_mf_legendary_plus from '/assets/modules_cannon/mf_legendary_plus.png';
import can_mf_legendary from '/assets/modules_cannon/mf_legendary.png';
import can_mf_epic_plus from '/assets/modules_cannon/mf_epic_plus.png';
import can_mf_epic from '/assets/modules_cannon/mf_epic.png';
import can_mf_empty from '/assets/modules_cannon/mf_empty.png';
import can_mf_common from '/assets/modules_cannon/mf_common.png';
import can_mf_ancestral from '/assets/modules_cannon/mf_ancestral.png';
import can_epic_hb from '/assets/modules_cannon/epic_hb.png';
import can_epic_dp from '/assets/modules_cannon/epic_dp.png';
import can_epic_ba from '/assets/modules_cannon/epic_ba.png';
import can_epic_ad from '/assets/modules_cannon/epic_ad.png';
import can_common_mc from '/assets/modules_cannon/common_mc.png';
import can_common_ec from '/assets/modules_cannon/common_ec.png';
import can_type from '/assets/modules_cannon/type.png';
import can_rare_sb from '/assets/modules_cannon/rare_sb.png';
import can_rare_rb from '/assets/modules_cannon/rare_rb.png';
import can_rare_ob from '/assets/modules_cannon/rare_ob.png';
import can_rare_bb from '/assets/modules_cannon/rare_bb.png';

// Re-use the centralized BACKGROUNDS map from backgrounds.js so images are imported once
import { BACKGROUNDS } from './backgrounds.js';
// Re-export BACKGROUNDS as a named export so callers can import it directly from this module
export { BACKGROUNDS };

// Minimal ASSETS map structure used by render code: dirKey -> { key: url }
export const ASSETS = {
  modules_generator: {
    rare_sl: gen_rare_sl,
    rare_sds: gen_rare_sds,
    rare_os: gen_rare_os,
    rare_ar: gen_rare_ar,
    mf_rare_plus: gen_mf_rare_plus,
    mf_rare: gen_mf_rare,
    mf_mythic_plus: gen_mf_mythic_plus,
    mf_mythic: gen_mf_mythic,
    mf_legendary_plus: gen_mf_legendary_plus,
    mf_legendary: gen_mf_legendary,
    mf_epic_plus: gen_mf_epic_plus,
    mf_epic: gen_mf_epic,
    mf_empty: gen_mf_empty,
    mf_common: gen_mf_common,
    mf_ancestral: gen_mf_ancestral,
    generator_type: gen_generator_type,
    epic_sh: gen_epic_sh,
    epic_ph: gen_epic_ph,
    epic_gc: gen_epic_gc,
    epic_bhd: gen_epic_bhd,
    common_mc: gen_common_mc,
    common_ec: gen_common_ec,
  },
  modules_core: {
    type: core_type,
    rare_ms: core_rare_ms,
    rare_gl: core_rare_gl,
    rare_em: core_rare_em,
    rare_cs: core_rare_cs,
    mf_rare_plus: core_mf_rare_plus,
    mf_rare: core_mf_rare,
    mf_mythic_plus: core_mf_mythic_plus,
    mf_mythic: core_mf_mythic,
    mf_legendary_plus: core_mf_legendary_plus,
    mf_legendary: core_mf_legendary,
    mf_epic_plus: core_mf_epic_plus,
    mf_epic: core_mf_epic,
    mf_empty: core_mf_empty,
    mf_common: core_mf_common,
    mf_ancestral: core_mf_ancestral,
    epic_oc: core_epic_oc,
    epic_mvn: core_epic_mvn,
    epic_hc: core_epic_hc,
    epic_dc: core_epic_dc,
    common_mc: core_common_mc,
    common_ec: core_common_ec,
  },
  modules_armor: {
    rare_pc: arm_rare_pc,
    rare_ni: arm_rare_ni,
    rare_dn: arm_rare_dn,
    mf_rare_plus: arm_mf_rare_plus,
    mf_rare: arm_mf_rare,
    mf_mythic_plus: arm_mf_mythic_plus,
    mf_mythic: arm_mf_mythic,
    mf_legendary_plus: arm_mf_legendary_plus,
    mf_legendary: arm_mf_legendary,
    rare_sr: arm_rare_sr,
    mf_epic_plus: arm_mf_epic_plus,
    mf_epic: arm_mf_epic,
    mf_empty: arm_mf_empty,
    mf_common: arm_mf_common,
    mf_ancestral: arm_mf_ancestral,
    epic_wr: arm_epic_wr,
    epic_sd: arm_epic_sd,
    epic_nmp: arm_epic_nmp,
    epic_acp: arm_epic_acp,
    common_mb: arm_common_mb,
    common_eb: arm_common_eb,
    type: arm_type,
  },
  modules_cannon: {
    mf_rare_plus: can_mf_rare_plus,
    mf_rare: can_mf_rare,
    mf_mythic_plus: can_mf_mythic_plus,
    mf_mythic: can_mf_mythic,
    mf_legendary_plus: can_mf_legendary_plus,
    mf_legendary: can_mf_legendary,
    mf_epic_plus: can_mf_epic_plus,
    mf_epic: can_mf_epic,
    mf_empty: can_mf_empty,
    mf_common: can_mf_common,
    mf_ancestral: can_mf_ancestral,
    epic_hb: can_epic_hb,
    epic_dp: can_epic_dp,
    epic_ba: can_epic_ba,
    epic_ad: can_epic_ad,
    common_mc: can_common_mc,
    common_ec: can_common_ec,
    type: can_type,
    rare_sb: can_rare_sb,
    rare_rb: can_rare_rb,
    rare_ob: can_rare_ob,
    rare_bb: can_rare_bb,
  }
};

export const TYPE_TOKENS = {
  Generator: gen_generator_type,
  Core: core_type,
  Armor: arm_type,
  Cannon: can_type,
};

export { importedMergeChart, bossImg as BOSS_IMG, mineAsset as MINE_ASSET };

export default {
  ASSETS,
  BACKGROUNDS,
  TYPE_TOKENS,
  importedMergeChart,
  BOSS_IMG: bossImg,
  MINE_ASSET: mineAsset,
};
