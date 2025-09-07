// Mapping of module image tokens per type directory. This file is a lightweight
// index so other code can reference type-specific assets by a consistent name.

import gen_mf_common from '/assets/modules_generator/mf_common.png';
import gen_mf_rare from '/assets/modules_generator/mf_rare.png';
import gen_generator_type from '/assets/modules_generator/generator_type.png';
import gen_common_mc from '/assets/modules_generator/common_mc.png';
import gen_common_ec from '/assets/modules_generator/common_ec.png';

import core_type from '/assets/modules_core/type.png';
import core_mf_common from '/assets/modules_core/mf_common.png';

import arm_type from '/assets/modules_armor/type.png';
import arm_mf_common from '/assets/modules_armor/mf_common.png';

import can_type from '/assets/modules_cannon/type.png';
import can_mf_common from '/assets/modules_cannon/mf_common.png';

export const MODULES_GENERATOR = {
  mf_common: gen_mf_common,
  mf_rare: gen_mf_rare,
  generator_type: gen_generator_type,
  common_mc: gen_common_mc,
  common_ec: gen_common_ec,
};

export const MODULES_CORE = {
  type: core_type,
  mf_common: core_mf_common,
};

export const MODULES_ARMOR = {
  type: arm_type,
  mf_common: arm_mf_common,
};

export const MODULES_CANNON = {
  type: can_type,
  mf_common: can_mf_common,
};

export const MODULES = {
  generator: MODULES_GENERATOR,
  core: MODULES_CORE,
  armor: MODULES_ARMOR,
  cannon: MODULES_CANNON,
};

export default MODULES;
