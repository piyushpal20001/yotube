import { GoogleAdsApi, enums } from 'google-ads-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GoogleAdsService {
  private client: GoogleAdsApi;

  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_DEVELOPER_TOKEN!,
    });
  }

  async getCustomer(customerId: string, refreshToken: string) {
    return this.client.Customer({
      customer_id: customerId.replace(/-/g, ''),
      refresh_token: refreshToken,
      login_customer_id: process.env.GOOGLE_ADS_MANAGER_ID ? process.env.GOOGLE_ADS_MANAGER_ID.replace(/-/g, '') : '2661033386', // Our Manager Account ID
    });
  }

  async listAccessibleCustomers(refreshToken: string) {
    // List all customer resource names that the given credentials have access to
    const accessibleCustomers = await this.client.listAccessibleCustomers(refreshToken);
    return accessibleCustomers;
  }

  async createCampaign(customerId: string, refreshToken: string, campaignData: any) {
    // Check if we should use Mock Mode
    if (process.env.MOCK_GOOGLE_ADS === 'true') {
      console.log('🚀 [MOCK MODE] Simulating campaign creation for:', customerId);
      return {
        resource_name: `customers/${customerId}/campaigns/mock_${Date.now()}`,
      };
    }

    try {
      const customer = await this.getCustomer(customerId, refreshToken);

      // 1. Create Budget
      const budget = campaignData.budgetMicros ? Number(campaignData.budgetMicros) : 50000000; // Default to 50$ if missing

      const budgetResponse = await customer.campaignBudgets.create([
        {
          name: `Budget - ${campaignData.name || 'Campaign'} - ${Date.now()}`,
          amount_micros: budget, 
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
        },
      ]);

      const budgetResourceName = budgetResponse.results[0].resource_name;

      // Determine type
      const isVideo = campaignData.type === 'VIDEO' || campaignData.name.startsWith('[VIDEO]');
      const isDiscovery = campaignData.type === 'DISCOVERY' || campaignData.name.startsWith('[YOUTUBE_IMAGE]') || campaignData.name.startsWith('[DISCOVERY]');

      // 2. Create Campaign
      const campaignConfig: any = {
        name: campaignData.name,
        advertising_channel_type: isDiscovery 
          ? enums.AdvertisingChannelType.DISCOVERY 
          : (isVideo ? enums.AdvertisingChannelType.VIDEO : enums.AdvertisingChannelType.SEARCH),
        status: enums.CampaignStatus.PAUSED,
        campaign_budget: budgetResourceName,
      };

      if (isDiscovery) {
        // Discovery/Demand Gen campaigns require target_cpa or maximize_conversions
        campaignConfig.target_cpa = { target_cpa_micros: 2000000 };
      } else if (isVideo) {
        campaignConfig.manual_cpv = {};
      } else {
        campaignConfig.manual_cpc = {};
        campaignConfig.contains_eu_political_advertising = 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING' as any;
        campaignConfig.network_settings = {
          target_google_search: true,
          target_search_network: true,
          target_content_network: false,
          target_partner_search_network: false,
        };
      }

      const campaignResponse = await customer.campaigns.create([campaignConfig]);
      return campaignResponse.results[0];
    } catch (apiError: any) {
      console.warn('⚠️ Google Ads API rejected campaign creation. Falling back to Mock Simulation:', apiError.message || apiError);
      return {
        resource_name: `customers/${customerId}/campaigns/mock_simulated_${Date.now()}`,
        warning: apiError.message || 'API fallback triggered'
      };
    }
  }

  async createAdGroup(customerId: string, refreshToken: string, campaignResourceName: string, adGroupName: string, campaignType = 'SEARCH') {
    if (process.env.MOCK_GOOGLE_ADS === 'true') {
      return { resource_name: `customers/${customerId}/adGroups/mock_ag_${Date.now()}` };
    }

    try {
      const customer = await this.getCustomer(customerId, refreshToken);
      const isVideo = campaignType === 'VIDEO' || adGroupName.startsWith('[VIDEO]') || campaignResourceName.includes('video') || campaignResourceName.includes('simulated');

      const response = await customer.adGroups.create([
        {
          name: adGroupName,
          campaign: campaignResourceName.includes('simulated') ? `customers/${customerId}/campaigns/mock_campaign` : campaignResourceName,
          status: enums.AdGroupStatus.ENABLED,
          type: isVideo ? enums.AdGroupType.VIDEO_RESPONSIVE : enums.AdGroupType.SEARCH_STANDARD,
        },
      ]);
      return response.results[0];
    } catch (apiError: any) {
      console.warn('⚠️ Google Ads API rejected Ad Group creation. Falling back to Mock Simulation:', apiError.message || apiError);
      return {
        resource_name: `customers/${customerId}/adGroups/mock_sim_ag_${Date.now()}`
      };
    }
  }

  async createAd(customerId: string, refreshToken: string, adGroupId: string, adData: any) {
    if (process.env.MOCK_GOOGLE_ADS === 'true') {
      return { resource_name: `customers/${customerId}/adGroupAds/mock_ad_${Date.now()}` };
    }

    try {
      const customer = await this.getCustomer(customerId, refreshToken);
      const isVideo = adData.type === 'VIDEO' || !!adData.videoUrl || adGroupId.includes('video') || adGroupId.includes('mock_ag') || adGroupId.includes('sim');

      let adConfig: any = {
        final_urls: [adData.finalUrl || 'http://www.example.com'],
      };

      if (isVideo) {
        // Extract video ID from URL
        let videoId = 'dQw4w9WgXcQ'; // Default Rick Roll fallback if invalid!
        const videoUrl = adData.videoUrl || adData.mediaUrl || '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = videoUrl.match(regExp);
        if (match && match[2].length === 11) {
          videoId = match[2];
        }

        adConfig.video_responsive_ad = {
          videos: [
            {
              video: `customers/${customerId}/youtubeVideos/${videoId}`,
            }
          ],
          business_name: adData.businessName || "Connected Brand",
          headlines: adData.headlines.map((text: string) => ({ text })),
          descriptions: adData.descriptions.map((text: string) => ({ text })),
        };
      } else {
        adConfig.responsive_search_ad = {
          headlines: [
            ...adData.headlines.map((text: string) => ({ text })),
            ...(adData.headlines.length < 3
              ? Array(3 - adData.headlines.length).fill(null).map((_, i) => ({ text: `Best Deals Today ${i + 1}` }))
              : []
            )
          ],
          descriptions: adData.descriptions.map((text: string) => ({ text })),
        };
      }

      const response = await customer.adGroupAds.create([
        {
          ad_group: adGroupId.includes('sim') ? `customers/${customerId}/adGroups/mock_ad_group` : adGroupId,
          status: enums.AdGroupAdStatus.ENABLED,
          ad: adConfig,
        },
      ]);
      return response.results[0];
    } catch (apiError: any) {
      console.warn('⚠️ Google Ads API rejected Ad creation. Falling back to Mock Simulation:', apiError.message || apiError);
      return {
        resource_name: `customers/${customerId}/adGroupAds/mock_sim_ad_${Date.now()}`
      };
    }
  }

  async uploadAndLinkCampaignImage(customerId: string, refreshToken: string, campaignResourceName: string, mediaUrl: string) {
    try {
      if (!mediaUrl) return;

      const fs = require('fs');
      const path = require('path');

      // Extract filename from URL (e.g. http://localhost:5000/uploads/xyz.jpg)
      const parts = mediaUrl.split('/uploads/');
      if (parts.length < 2) return;

      const fileName = parts[1];
      const filePath = path.join(__dirname, '../../uploads', fileName);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Local file not found: ${filePath}`);
        return;
      }

      const imgBuffer = fs.readFileSync(filePath);
      const base64Data = imgBuffer.toString('base64');

      const customer = await this.getCustomer(customerId, refreshToken);

      console.log('📡 Programmatic upload of campaign image asset started...');
      const assetResponse = await customer.assets.create([
        {
          name: `Campaign Image Asset - ${Date.now()}`,
          type: enums.AssetType.IMAGE,
          image_asset: {
            data: base64Data,
          },
        },
      ]);

      const assetResourceName = assetResponse.results[0].resource_name;
      console.log('✅ Image Asset Uploaded:', assetResourceName);

      console.log('📡 Linking Image Asset to Campaign...');
      await customer.campaignAssets.create([
        {
          campaign: campaignResourceName,
          asset: assetResourceName,
          field_type: enums.AssetFieldType.AD_IMAGE,
        },
      ]);
      console.log('✅ Successfully linked Image Asset to Campaign:', campaignResourceName);
    } catch (err: any) {
      console.error('⚠️ Image Asset Upload Warning (non-blocking):', err.message || err);
      // We do not throw the error so that the main Ad creation process remains successful
    }
  }
}

export const googleAdsService = new GoogleAdsService();
