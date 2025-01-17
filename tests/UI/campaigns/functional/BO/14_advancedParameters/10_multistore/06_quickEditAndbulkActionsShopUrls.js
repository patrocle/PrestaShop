// Import utils
import helper from '@utils/helpers';

// Import test context
import testContext from '@utils/testContext';

require('module-alias/register');

const {expect} = require('chai');

// Import login steps
const loginCommon = require('@commonTests/BO/loginBO');

// Import pages
const dashboardPage = require('@pages/BO/dashboard');
const generalPage = require('@pages/BO/shopParameters/general');
const multiStorePage = require('@pages/BO/advancedParameters/multistore');
const addShopUrlPage = require('@pages/BO/advancedParameters/multistore/url/addURL');
const shopUrlPage = require('@pages/BO/advancedParameters/multistore/url');

// Import data
const ShopFaker = require('@data/faker/shop');

const baseContext = 'functional_BO_advancedParameters_multistore_quickEditAndBulkActionsShopUrls';

let browserContext;
let page;
let numberOfShopUrls = 0;
const ShopUrlData = new ShopFaker({name: 'ToDelete'});

/*
Enable multistore
Create shop url
Quick edit (enable, disable)
Bulk actions (enable, disable)
Deleted created shop url
Disable multistore
 */
describe('BO - Advanced Parameters - Multistore : Quick edit and bulk actions shop Urls', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  it('should login in BO', async function () {
    await loginCommon.loginBO(this, page);
  });

  // 1 : Enable multi store
  describe('Enable \'Multistore\'', async () => {
    it('should go to \'Shop Parameters > General\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToGeneralPage', baseContext);

      await dashboardPage.goToSubMenu(
        page,
        dashboardPage.shopParametersParentLink,
        dashboardPage.shopParametersGeneralLink,
      );

      await generalPage.closeSfToolBar(page);

      const pageTitle = await generalPage.getPageTitle(page);
      await expect(pageTitle).to.contains(generalPage.pageTitle);
    });

    it('should enable \'Multistore\'', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'enableMultiStore', baseContext);

      const result = await generalPage.setMultiStoreStatus(page, true);
      await expect(result).to.contains(generalPage.successfulUpdateMessage);
    });
  });

  // 2 : Go to multistore page
  describe('Go to \'Multistore\' page', async () => {
    it('should go to \'Advanced parameters > Multistore\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToMultiStorePage', baseContext);

      await dashboardPage.goToSubMenu(
        page,
        dashboardPage.advancedParametersLink,
        dashboardPage.multistoreLink,
      );

      const pageTitle = await multiStorePage.getPageTitle(page);
      await expect(pageTitle).to.contains(multiStorePage.pageTitle);
    });

    it('should go to shop Urls page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToShopUrlsPage', baseContext);

      await multiStorePage.goToShopURLPage(page, 1);

      const pageTitle = await multiStorePage.getPageTitle(page);
      await expect(pageTitle).to.contains(multiStorePage.pageTitle);
    });

    it('should reset filter and get the number of shop urls', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilter', baseContext);

      numberOfShopUrls = await shopUrlPage.resetAndGetNumberOfLines(page);
      await expect(numberOfShopUrls).to.be.above(0);
    });
  });

  // 3 : Create shop url
  describe('Create shop Url', async () => {
    it('should go to add shop URL', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToAddURL', baseContext);

      await shopUrlPage.goToAddNewUrl(page);

      const pageTitle = await addShopUrlPage.getPageTitle(page);
      await expect(pageTitle).to.contains(addShopUrlPage.pageTitleCreate);
    });

    it('should create shop URL', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'addURL', baseContext);

      const textResult = await addShopUrlPage.setVirtualUrl(page, ShopUrlData);
      await expect(textResult).to.contains(addShopUrlPage.successfulCreationMessage);
    });
  });

  // 4 : Quick edit shop url
  describe('Quick edit shop url', async () => {
    it('should filter list by URL', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterForQuickEdit', baseContext);

      await shopUrlPage.filterTable(page, 'input', 'url', ShopUrlData.name);

      const numberOfShopUrlsAfterFilter = await shopUrlPage.getNumberOfElementInGrid(page);

      for (let i = 1; i <= numberOfShopUrlsAfterFilter; i++) {
        const textColumn = await shopUrlPage.getTextColumn(page, i, 'url');
        await expect(textColumn).to.contains(ShopUrlData.name);
      }
    });

    [
      {
        args: {
          column: 6, columnName: 'Enabled', action: 'disable', enabledValue: false,
        },
      },
      {
        args: {
          column: 6, columnName: 'Enabled', action: 'enable', enabledValue: true,
        },
      },
      {
        args: {
          column: 5, columnName: 'Is it the mail URL', action: 'enable', enabledValue: true,
        },
      },
    ].forEach((test, index) => {
      it(`should ${test.args.action} the column '${test.args.columnName}'`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.action}_${index}`, baseContext);

        const isActionPerformed = await shopUrlPage.setStatus(page, 1, test.args.column, test.args.enabledValue);

        if (isActionPerformed) {
          const resultMessage = await shopUrlPage.getAlertSuccessBlockContent(page);

          if (test.args.columnName === 'Enabled') {
            await expect(resultMessage).to.contains(shopUrlPage.successUpdateMessage);
          } else {
            await expect(resultMessage).to.contains(shopUrlPage.successfulUpdateMessage);
          }
        }

        const carrierStatus = await shopUrlPage.getStatus(page, 1, test.args.column);
        await expect(carrierStatus).to.be.equal(test.args.enabledValue);
      });
    });

    it('should reset all filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilterAfterEnableDisable', baseContext);

      const numberOfShopUrlsAfterReset = await shopUrlPage.resetAndGetNumberOfLines(page);
      await expect(numberOfShopUrlsAfterReset).to.be.equal(numberOfShopUrls + 1);
    });

    it('should set the default URL as the main URL', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'setDefaultMainURL', baseContext);

      const isActionPerformed = await shopUrlPage.setStatus(page, 1, 5, true);

      if (isActionPerformed) {
        const resultMessage = await shopUrlPage.getAlertSuccessBlockContent(page);
        await expect(resultMessage).to.contains(shopUrlPage.successfulUpdateMessage);
      }

      const carrierStatus = await shopUrlPage.getStatus(page, 1, 5);
      await expect(carrierStatus).to.be.equal(true);
    });
  });

  // 5 : Bulk actions shop url
  describe('Bulk actions shop url', async () => {
    it('should filter list by URL', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterForBulkActions', baseContext);

      await shopUrlPage.filterTable(page, 'input', 'url', ShopUrlData.name);

      const numberOfShopUrlsAfterFilter = await shopUrlPage.getNumberOfElementInGrid(page);

      for (let i = 1; i <= numberOfShopUrlsAfterFilter; i++) {
        const textColumn = await shopUrlPage.getTextColumn(page, i, 'url');
        await expect(textColumn).to.contains(ShopUrlData.name);
      }
    });

    [
      {args: {status: 'disable', enable: false}},
      {args: {status: 'enable', enable: true}},
    ].forEach((test) => {
      it(`should ${test.args.status} shop url with Bulk Actions and check result`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.status}ShopUrl`, baseContext);

        const textResult = await shopUrlPage.bulkSetStatus(page, test.args.enable);
        await expect(textResult, 'Status is not updated!').to.be.equal(shopUrlPage.successfulUpdateStatusMessage);
      });
    });

    it('should reset all filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilterAfterBulkActions', baseContext);

      const numberOfShopUrlsAfterReset = await shopUrlPage.resetAndGetNumberOfLines(page);
      await expect(numberOfShopUrlsAfterReset).to.be.equal(numberOfShopUrls + 1);
    });
  });

  // 6 : Delete created shop url
  describe('delete the created shop url', async () => {
    it('should delete the shop url contains \'ToDelete\'', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteShopUrl', baseContext);

      await shopUrlPage.filterTable(page, 'input', 'url', ShopUrlData.name);

      const textResult = await shopUrlPage.deleteShopURL(page, 1);
      await expect(textResult).to.contains(shopUrlPage.successfulDeleteMessage);
    });
  });

  // 7 : Disable multi store
  describe('Disable \'Multistore\'', async () => {
    it('should go to \'Shop parameters > General\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToGeneralPage2', baseContext);

      await dashboardPage.goToSubMenu(
        page,
        dashboardPage.shopParametersParentLink,
        dashboardPage.shopParametersGeneralLink,
      );

      await generalPage.closeSfToolBar(page);

      const pageTitle = await generalPage.getPageTitle(page);
      await expect(pageTitle).to.contains(generalPage.pageTitle);
    });

    it('should disable \'Multistore\'', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'disableMultiStore', baseContext);

      const result = await generalPage.setMultiStoreStatus(page, false);
      await expect(result).to.contains(generalPage.successfulUpdateMessage);
    });
  });
});
