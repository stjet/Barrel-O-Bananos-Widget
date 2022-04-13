# Barrel O' Bananos
An easily forkable and configurable Banano faucet widget for YOUR site! Increase traffic and get involved in the banano ecosystem.

## Config.json Documentation

**address**: Address of the faucet

**claim_freq**: Claim frequency of faucet for each user in milliseconds

**hcaptcha_sitekey**: Hcaptcha sitekey for the captcha. Should look like `9e25731c-b4b7-4ccf-a454-72f303c04a9f`

**allowed_site**: Sites that should be allowed to embed. Put in a wildcard (`*`) to allow all sites to embed.

## Embedding Documentation

Run your own instance and then embed using an iframe. Make sure iframe height and width are equal. Designed for smaller embeds but is functional for bigger ones.

Example: 
```html
<iframe src="https://<yourbarrelobananosinstance.com>" style="height: 25vw; width: 25vw;" scrolling="no"></iframe>
```

/files/embed.html has examples of the embeds at various sizes.

Obviously you can mess with the height and width.

## Secrets (.env files!) Documentation

All these should be stored securely in an .env file. Do not commit these or put them anywhere that can be accessed publically.

**seed**: Banano seed

**hcaptcha secret**: Secret for hcaptcha

**connection_string**: Full connection string for mongodb