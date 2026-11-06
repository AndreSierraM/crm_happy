import { Locator, Page } from '@playwright/test';

export class ProfileSection {
  private readonly firstNameField: Locator;
  private readonly lastNameField: Locator;
  private readonly emailField: Locator;
  private readonly currentPasswordField: Locator;
  private readonly newPasswordField: Locator;
  private readonly changePasswordButton: Locator;
  private readonly deleteAccountButton: Locator;

  constructor(public readonly page: Page) {
    this.page = page;
    this.firstNameField = page.getByPlaceholder('Tim');
    this.lastNameField = page.getByPlaceholder('Cook');
    this.emailField = page.getByRole('textbox').nth(2);
    this.currentPasswordField = page.getByPlaceholder('Current Password');
    this.newPasswordField = page.getByPlaceholder('New Password');
    this.changePasswordButton = page.getByRole('button', {
      name: 'Change Password',
    });
    this.deleteAccountButton = page.getByRole('button', {
      name: 'Delete account',
    });
  }

  async changeFirstName(firstName: string) {
    await this.firstNameField.clear();
    await this.firstNameField.fill(firstName);
  }

  async changeLastName(lastName: string) {
    await this.lastNameField.clear();
    await this.lastNameField.fill(lastName);
  }

  async getEmail() {
    await this.emailField.textContent();
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.currentPasswordField.fill(currentPassword);
    await this.newPasswordField.fill(newPassword);
    await this.changePasswordButton.click();
  }

  async deleteAccount() {
    await this.deleteAccountButton.click();
  }
}
