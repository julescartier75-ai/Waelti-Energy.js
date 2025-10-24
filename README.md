# Energy Dashboard – Vercel (JavaScript Only)

## Déploiement
1) Crée un dépôt GitHub et uploade **tout le contenu** de ce dossier à la racine (pas de sous-dossier).
2) Sur Vercel → Import Project → ce dépôt.
3) Ajoute les variables d’environnement :
   - SOLARMGR_BASE = https://cloud.solar-manager.ch
   - SOLARMGR_USER = (email)
   - SOLARMGR_PASS = (mot de passe)
   - SOLARMGR_SMID = (Solar Manager ID)
   - ECARUP_AUTH_URL = https://login.smart-me.com/oauth/token
   - ECARUP_CLIENT_ID = (client id)
   - ECARUP_CLIENT_SECRET = (client secret)
   - ECARUP_API = https://public-api.ecarup.com
4) Deploy → ouvre l’URL.

Si tu vois 404, vérifie que `package.json`, `app/`, `styles/` sont **à la racine** du repo GitHub.
