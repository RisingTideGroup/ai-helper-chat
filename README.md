# ai-helper-chat
## This is very much beta and a work in progress
A simple AI Chat bot in a Browser Plugin that can connect to HaloAPI so you can talk to your data.

Plugin will securely use Chrome to store the Client ID and Secret, and authenticate to HaloPSA using your own Agent Credentials

<img width="448" alt="image" src="https://github.com/user-attachments/assets/b8462790-f2c6-49d8-8e99-fb6a4ebe4d8f" />

Once connected, plugin will prompt for AI Integration details

<img width="448" alt="image" src="https://github.com/user-attachments/assets/6c1368ea-d56e-4e1b-badc-d1ecfa093535" />

You can also disconnect/adjust the HaloPSA settings from the settings screen once connected

<img width="448" alt="image" src="https://github.com/user-attachments/assets/4bcdbfd1-2a5c-47e7-bf70-e0c77cb9cd8e" />

Use the Function Manager to define API endpoints the Chat Bot can interact with

<img width="448" alt="image" src="https://github.com/user-attachments/assets/34cac4eb-dd0c-4e20-a1db-0803516575d7" />

# Connecting HaloPSA
1. First you (or a HaloPSA Admin) needs to create an API Application in HaloPSA, under **Configuration > Integrations > HaloPSA API**
2. Then click **View Applications** and **New** on the top right corner
   - **Application Name**: HaloPSA AI Chat Browser Plugin
   - **Authentication Method**: Authorisation Code (Native Application)
   - **Client Secret**: Use a client secret for the token request
   - **Login Redirect URL**: You need to enter *exactly* "https://omihlfdnlonfpghloolipklmggpbhapj.chromiumapp.org/oauth2"
   - **Logout Redirect URL**: Leave this blank
   - **Branding**: This is up to you, but primarily this will be your primary organization.
   - **Allow Agent / User Login**: You cannot have both enabled at the same time. This plugin is intended to be used with Agent Login
 3. Click on the **Permissions** tab and select the scope **all:standard**
 4. Click on **Authentication Options** and configure the login page to present the options that should be allowed for the plugin


 # Browser Plugin Vision
 - Community Centric: creating and sharing API methods to be able to bring it into the chat interface, including the ability to sync from multiple "repos" of custom functions
 - Improved API Results: We should be able to include an output schema that will filter the HaloPSA response to keep the Token Usage limited in the AI Chat and the context window down
 - Improved AI Chat: We should be talking an AI Assistant that gets created for the sake of the conversation as opposed to a simple chat completion
 - Additional Systems: We should be able to add additional integration connections (like Hudu/ ITGlue/ CW Manage etc.) to expose data from each to the AI Chat
 - Sidepane Interface: This was started but not finished
