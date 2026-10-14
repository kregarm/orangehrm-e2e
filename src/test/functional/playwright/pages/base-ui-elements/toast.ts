import {type Page} from '@playwright/test';

/**
 * A toast the app shows after an action, e.g. success "Successfully Saved"
 * or info "No Records Found"
 */
export const toast = (page: Page, type: 'success' | 'info', message: string) =>
  page.locator(`.oxd-toast--${type}`).filter({hasText: message});
