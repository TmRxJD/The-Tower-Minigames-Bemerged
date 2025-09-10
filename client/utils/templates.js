// Template utility functions
// These functions help with template lookups and management

import { MODULE_TEMPLATES, RARE_TEMPLATES, COMMON_TEMPLATES } from '../game/templates.js';

// Find a template by ID, searching across all template arrays
export function findTemplate(templateId) {
  if (!templateId) {
    return null;
  }
  // Search in MODULE_TEMPLATES first
  let template = MODULE_TEMPLATES.find(t => t.id === templateId);
  if (template) {
    return template;
  }
  // Search in RARE_TEMPLATES
  template = RARE_TEMPLATES.find(t => t.id === templateId);
  if (template) {
    return template;
  }
  // Search in COMMON_TEMPLATES
  template = COMMON_TEMPLATES.find(t => t.id === templateId);
  return template || null;
}
