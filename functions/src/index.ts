/**
 * Cloud Functions for SkillBridge Mobile App
 * 
 * Serverless backend functions for:
 * - Review aggregation (Requirements 12.1-12.7)
 * - Push notifications (Requirements 19.3-19.7)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================================================
// Review Aggregation Function
// ============================================================================

/**
 * Triggered when a new review is created
 * Calculates and updates the reviewee's aggregate rating and review count
 * 
 * Requirements: 12.1-12.7
 */
export const onReviewCreate = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snapshot, context) => {
    try {
      const review = snapshot.data();
      const revieweeId = review.revieweeId;

      // Fetch all reviews for the reviewee (Requirement 12.1)
      const reviewsSnapshot = await db
        .collection('reviews')
        .where('revieweeId', '==', revieweeId)
        .get();

      // Calculate aggregates (Requirement 12.2)
      let totalRating = 0;
      let count = 0;

      reviewsSnapshot.forEach((doc) => {
        const reviewData = doc.data();
        totalRating += reviewData.rating;
        count++;
      });

      // Calculate average rating (Requirement 12.2-12.3)
      const averageRating = count > 0 ? totalRating / count : 0;

      // Ensure rating is between 0 and 5 (Requirement 12.7)
      const clampedRating = Math.max(0, Math.min(5, averageRating));

      // Update user document (Requirements 12.3-12.5)
      await db.collection('users').doc(revieweeId).update({
        rating: clampedRating,
        reviewCount: count,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      functions.logger.info(
        `Updated user ${revieweeId} rating to ${clampedRating} (${count} reviews)`
      );

      return null;
    } catch (error) {
      functions.logger.error('Error aggregating reviews:', error);
      throw error;
    }
  });

// ============================================================================
// Push Notification Functions
// ============================================================================

/**
 * Triggered when a new message is created
 * Sends push notification to the recipient if they're not actively viewing the conversation
 * 
 * Requirements: 19.3-19.7
 */
export const onMessageCreate = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    try {
      const message = snapshot.data();
      const conversationId = context.params.conversationId;
      const senderId = message.senderId;

      // Get conversation details
      const conversationDoc = await db
        .collection('conversations')
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        functions.logger.warn(`Conversation ${conversationId} not found`);
        return null;
      }

      const conversation = conversationDoc.data();
      if (!conversation) {
        return null;
      }

      // Find recipient (the participant who is not the sender)
      const recipientId = conversation.participants.find(
        (id: string) => id !== senderId
      );

      if (!recipientId) {
        functions.logger.warn('No recipient found for message');
        return null;
      }

      // Get recipient's device token
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      
      if (!recipientDoc.exists) {
        functions.logger.warn(`Recipient ${recipientId} not found`);
        return null;
      }

      const recipient = recipientDoc.data();
      if (!recipient || !recipient.fcmToken) {
        functions.logger.info(`Recipient ${recipientId} has no FCM token`);
        return null;
      }

      // Get sender details for notification
      const senderDoc = await db.collection('users').doc(senderId).get();
      const sender = senderDoc.data();
      const senderName = sender?.displayName || 'Someone';

      // Prepare notification payload (Requirement 19.3)
      const payload: admin.messaging.Message = {
        token: recipient.fcmToken,
        notification: {
          title: senderName,
          body: message.text.substring(0, 100) // Preview first 100 chars
        },
        data: {
          type: 'new_message',
          conversationId,
          senderId,
          senderName
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'messages'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      // Send notification
      await admin.messaging().send(payload);

      functions.logger.info(
        `Sent message notification to ${recipientId} from ${senderId}`
      );

      return null;
    } catch (error) {
      functions.logger.error('Error sending message notification:', error);
      // Don't throw - we don't want to fail the message creation
      return null;
    }
  });

/**
 * Triggered when a new match is found
 * Sends push notification to users about potential matches
 * 
 * Requirements: 19.4
 */
export const onMatchCreate = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snapshot, context) => {
    try {
      const match = snapshot.data();
      const userId = match.userId;
      const matchScore = match.score;

      // Get user's device token
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }

      const user = userDoc.data();
      if (!user || !user.fcmToken) {
        return null;
      }

      // Get matched user details
      const matchedUserDoc = await db.collection('users').doc(match.matchedUserId).get();
      const matchedUser = matchedUserDoc.data();
      const matchedUserName = matchedUser?.displayName || 'Someone';

      // Prepare notification payload (Requirement 19.4)
      const payload: admin.messaging.Message = {
        token: user.fcmToken,
        notification: {
          title: 'New Match Found!',
          body: `${matchedUserName} is a ${matchScore}% match for your skill post`
        },
        data: {
          type: 'new_match',
          matchId: context.params.matchId,
          matchedUserId: match.matchedUserId,
          score: matchScore.toString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'matches'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      // Send notification
      await admin.messaging().send(payload);

      functions.logger.info(`Sent match notification to ${userId}`);

      return null;
    } catch (error) {
      functions.logger.error('Error sending match notification:', error);
      return null;
    }
  });

// ============================================================================
// Session Completion Function
// ============================================================================

/**
 * Triggered when a session is marked as completed
 * Updates participants' sessionsCompleted count and awards points
 */
export const onSessionComplete = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();

      // Check if status changed to 'completed'
      if (before.status !== 'completed' && after.status === 'completed') {
        const participants = after.participants;

        // Update each participant's stats
        const updatePromises = participants.map(async (userId: string) => {
          const userRef = db.collection('users').doc(userId);
          
          return db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
              return;
            }

            const currentSessions = userDoc.data()?.sessionsCompleted || 0;
            const currentPoints = userDoc.data()?.points || 0;

            // Award 10 points per completed session
            transaction.update(userRef, {
              sessionsCompleted: currentSessions + 1,
              points: currentPoints + 10,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
        });

        await Promise.all(updatePromises);

        functions.logger.info(
          `Updated stats for ${participants.length} participants in session ${context.params.sessionId}`
        );
      }

      return null;
    } catch (error) {
      functions.logger.error('Error updating session completion stats:', error);
      throw error;
    }
  });
