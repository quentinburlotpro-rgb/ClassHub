const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

// Initialisation de l'application Admin pour avoir tous les droits sur la base de données
admin.initializeApp();

// Configuration des groupes (doit être identique à celle de l'application React)
const GROUPS_CONFIG = {
  'G1': { parent: 'TD1' },
  'G2': { parent: 'TD1' },
  'G3': { parent: 'TD2' },
  'G4': { parent: 'TD2' },
};

// On écoute directement la collection "events" à la racine de TON Firebase
exports.sendPushNotificationOnNewEvent = onDocumentCreated(
  "events/{eventId}",
  async (event) => {
    
    // Récupération des données dans la nouvelle syntaxe v2
    const snap = event.data;
    if (!snap) return null;

    const eventData = snap.data();
    const authorId = eventData.authorId;

    // 1. Si c'est un événement strictement personnel ("Moi uniquement"), on s'arrête tout de suite
    if (eventData.scope === authorId) {
      console.log("Événement personnel, aucune notification push à envoyer.");
      return null;
    }

    try {
      // On va chercher les utilisateurs directement dans la collection "users" à la racine
      const usersSnapshot = await admin.firestore().collection('users').get();
      const tokensToNotify = [];

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const userId = doc.id;

        // Ignorer l'auteur (on ne s'auto-notifie pas)
        if (userId === authorId) return;

        // Gérer le tableau de tokens (multi-appareils) ou l'ancien token unique pour la rétrocompatibilité
        const userTokens = Array.isArray(userData.fcmTokens) ? userData.fcmTokens : (userData.fcmToken ? [userData.fcmToken] : []);

        // Ignorer ceux qui n'ont pas activé les notifications (pas de token FCM)
        if (userTokens.length === 0) return;

        // STRICT VISIBILITY CHECK
        let isVisible = false;
        
        if (eventData.scope === 'PROMO') {
          isVisible = true; // Toute la promo
        } else if (eventData.scope === 'GROUP') {
          // Uniquement si l'ID de l'utilisateur est dans le tableau sharedWith
          isVisible = Array.isArray(eventData.sharedWith) && eventData.sharedWith.includes(userId);
        } else {
          // Filtrage par TD ou par Groupe
          const userGroup = userData.group;
          if (userGroup) {
            const config = GROUPS_CONFIG[userGroup] || {};
            if (eventData.scope === userGroup || eventData.scope === config.parent) {
              isVisible = true;
            }
          }
        }

        // Si l'utilisateur a le droit de voir le devoir, on garde TOUS ses Tokens de téléphone
        if (isVisible) {
          tokensToNotify.push(...userTokens);
        }
      });

      // S'il n'y a personne à notifier, on arrête là
      if (tokensToNotify.length === 0) {
        console.log("Aucun utilisateur concerné ou disposant d'un token valide.");
        return null;
      }

      // Préparation de la notification Push
      const notifTitle = eventData.category === 'POLL' ? "📊 Nouveau Sondage" : "📚 Nouveau Devoir";
      const notifBody = `${eventData.author || "Quelqu'un"} a ajouté : ${eventData.title}`;

      const payload = {
        notification: {
          title: notifTitle,
          body: notifBody,
        },
        tokens: tokensToNotify // On envoie uniquement aux tokens filtrés
      };

      // ⚠️ LA CORRECTION EST ICI : Remplacement de sendMulticast par sendEachForMulticast
      const response = await admin.messaging().sendEachForMulticast(payload);
      
      console.log(`${response.successCount} notifications Push envoyées avec succès pour l'événement ${event.params.eventId}`);
      
      // Gestion des tokens expirés (ex: quelqu'un a désinstallé l'appli)
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokensToNotify[idx]);
          }
        });
        console.log('Tokens échoués (probablement expirés) :', failedTokens);
      }

      return null;

    } catch (error) {
      console.error("Erreur critique lors de l'envoi du Push Notification:", error);
      return null;
    }
  }
);