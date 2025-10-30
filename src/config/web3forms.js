/**
 * Web3Forms configuration
 */

export const WEB3FORMS_CONFIG = {
  ACCESS_KEY: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '',
  ENDPOINT: 'https://api.web3forms.com/submit'
}

export const isWeb3FormsConfigured = () => {
  return Boolean(WEB3FORMS_CONFIG.ACCESS_KEY)
}


