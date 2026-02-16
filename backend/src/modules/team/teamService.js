import { db } from '../../config/firebase.js'
import crypto from 'crypto'

/**
 * TEAM STATE MACHINE
 * States: draft -> partial -> complete -> locked
 * 
 * draft: Team created, only leader
 * partial: Has some members but not full
 * complete: Has required members, can register
 * locked: Registration submitted, no more changes
 */

export class TeamService {
  static TEAM_STATES = {
    DRAFT: 'draft',
    PARTIAL: 'partial',
    COMPLETE: 'complete',
    LOCKED: 'locked'
  }

  // ==================== TEAM CREATION ====================
  
  /**
   * Create team for an event
   * Initial state: draft
   */
  static async createTeam(teamData, leaderId) {
    try {
      const { eventId, name } = teamData

      // Passes = sub-events: read from pass_types
      const passTypeDoc = await db.collection('pass_types').doc(eventId).get()
      if (!passTypeDoc.exists) {
        throw new Error('Pass/sub-event not found')
      }
      const eventData = passTypeDoc.data()
      if (eventData.active === false || eventData.isActive === false) {
        throw new Error('This pass/sub-event is not active')
      }

      // Validate user owns this pass
      const { PassService } = await import('../pass/passService.js')
      const passValidation = await PassService.validatePassForEvent(leaderId, eventId)
      if (!passValidation.valid) {
        throw new Error(passValidation.reason || 'You need to purchase this pass to create a team.')
      }

      // Check if user already has a team in this event
      const existingTeamSnapshot = await db.collection('teams')
        .where('eventId', '==', eventId)
        .where('leaderId', '==', leaderId)
        .where('state', 'in', ['draft', 'partial', 'complete', 'locked'])
        .get()
      
      if (!existingTeamSnapshot.empty) {
        throw new Error('You already have a team in this event')
      }
      
      // Check if user is member of another team in this event
      const memberSnapshot = await db.collection('teamMembers')
        .where('userId', '==', leaderId)
        .where('eventId', '==', eventId)
        .where('status', '==', 'active')
        .get()
      
      if (!memberSnapshot.empty) {
        throw new Error('You are already part of a team in this event')
      }
      
      // Generate unique join code
      const joinCode = this.generateJoinCode()
      
      // Create team
      const teamRef = await db.collection('teams').add({
        eventId,
        name,
        leaderId,
        state: this.TEAM_STATES.DRAFT,
        joinCode,
        maxSize: eventData.maxTeamSize,
        currentSize: 1,
        isPublic: teamData.isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Add leader as first member
      await db.collection('teamMembers').add({
        teamId: teamRef.id,
        eventId,
        userId: leaderId,
        role: 'leader',
        status: 'active',
        joinedAt: new Date()
      })
      
      return {
        id: teamRef.id,
        eventId,
        name,
        state: this.TEAM_STATES.DRAFT,
        joinCode,
        currentSize: 1,
        maxSize: eventData.maxTeamSize
      }
    } catch (error) {
      console.error('[TeamService.createTeam] Error:', error.message)
      throw error
    }
  }

  // ==================== JOIN TEAM ====================
  
  /**
   * Join team via join code
   * Updates team state based on size
   */
  static async joinTeamByCode(joinCode, userId) {
    try {
      // Find team by join code
      const teamSnapshot = await db.collection('teams')
        .where('joinCode', '==', joinCode)
        .where('state', 'in', ['draft', 'partial'])
        .limit(1)
        .get()
      
      if (teamSnapshot.empty) {
        throw new Error('Invalid join code or team is full/locked')
      }
      
      const teamDoc = teamSnapshot.docs[0]
      const teamData = teamDoc.data()

      // Joining also requires a pass that includes this event (one pass + one event)
      const { PassService } = await import('../pass/passService.js')
      const passValidation = await PassService.validatePassForEvent(userId, teamData.eventId)
      if (!passValidation.valid) {
        throw new Error(passValidation.reason || 'You need a pass that includes this event to join the team.')
      }

      // Check if user is already in a team for this event
      const existingMemberSnapshot = await db.collection('teamMembers')
        .where('userId', '==', userId)
        .where('eventId', '==', teamData.eventId)
        .where('status', '==', 'active')
        .get()
      
      if (!existingMemberSnapshot.empty) {
        throw new Error('You are already part of a team in this event')
      }
      
      // Check if team is full
      if (teamData.currentSize >= teamData.maxSize) {
        throw new Error('Team is full')
      }
      
      // Add member
      await db.collection('teamMembers').add({
        teamId: teamDoc.id,
        eventId: teamData.eventId,
        userId,
        role: 'member',
        status: 'active',
        joinedAt: new Date()
      })
      
      // Update team size and state
      const newSize = teamData.currentSize + 1
      const newState = this.calculateTeamState(newSize, teamData.maxSize)
      
      await teamDoc.ref.update({
        currentSize: newSize,
        state: newState,
        updatedAt: new Date()
      })
      
      return {
        teamId: teamDoc.id,
        state: newState,
        currentSize: newSize
      }
    } catch (error) {
      console.error('[TeamService.joinTeamByCode] Error:', error.message)
      throw error
    }
  }

  // ==================== LEAVE TEAM ====================
  
  /**
   * Leave team
   * Leader cannot leave unless they transfer leadership
   */
  static async leaveTeam(teamId, userId) {
    try {
      const teamDoc = await db.collection('teams').doc(teamId).get()
      
      if (!teamDoc.exists) {
        throw new Error('Team not found')
      }
      
      const teamData = teamDoc.data()
      
      // Check if team is locked
      if (teamData.state === this.TEAM_STATES.LOCKED) {
        throw new Error('Cannot leave a locked team')
      }
      
      // Check if user is leader
      if (teamData.leaderId === userId) {
        throw new Error('Leader cannot leave. Transfer leadership first or delete the team')
      }
      
      // Find and remove member
      const memberSnapshot = await db.collection('teamMembers')
        .where('teamId', '==', teamId)
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get()
      
      if (memberSnapshot.empty) {
        throw new Error('You are not a member of this team')
      }
      
      // Remove member
      await memberSnapshot.docs[0].ref.delete()
      
      // Update team size and state
      const newSize = teamData.currentSize - 1
      const newState = this.calculateTeamState(newSize, teamData.maxSize)
      
      await teamDoc.ref.update({
        currentSize: newSize,
        state: newState,
        updatedAt: new Date()
      })
      
      return {
        success: true,
        newState,
        currentSize: newSize
      }
    } catch (error) {
      console.error('[TeamService.leaveTeam] Error:', error.message)
      throw error
    }
  }

  // ==================== REMOVE MEMBER (Leader only) ====================
  
  /**
   * Remove member from team (leader only)
   */
  static async removeMember(teamId, memberUserId, leaderId) {
    try {
      const teamDoc = await db.collection('teams').doc(teamId).get()
      
      if (!teamDoc.exists) {
        throw new Error('Team not found')
      }
      
      const teamData = teamDoc.data()
      
      // Verify caller is leader
      if (teamData.leaderId !== leaderId) {
        throw new Error('Only team leader can remove members')
      }
      
      // Check if team is locked
      if (teamData.state === this.TEAM_STATES.LOCKED) {
        throw new Error('Cannot remove members from a locked team')
      }
      
      // Cannot remove leader
      if (memberUserId === leaderId) {
        throw new Error('Cannot remove team leader')
      }
      
      // Find and remove member
      const memberSnapshot = await db.collection('teamMembers')
        .where('teamId', '==', teamId)
        .where('userId', '==', memberUserId)
        .where('status', '==', 'active')
        .get()
      
      if (memberSnapshot.empty) {
        throw new Error('Member not found in team')
      }
      
      // Remove member
      await memberSnapshot.docs[0].ref.delete()
      
      // Update team size and state
      const newSize = teamData.currentSize - 1
      const newState = this.calculateTeamState(newSize, teamData.maxSize)
      
      await teamDoc.ref.update({
        currentSize: newSize,
        state: newState,
        updatedAt: new Date()
      })
      
      return {
        success: true,
        newState,
        currentSize: newSize
      }
    } catch (error) {
      console.error('[TeamService.removeMember] Error:', error.message)
      throw error
    }
  }

  // ==================== REPLACE MEMBER (Leader only) ====================
  
  /**
   * Replace a member with another user
   */
  static async replaceMember(teamId, oldMemberUserId, newMemberUserId, leaderId) {
    try {
      const teamDoc = await db.collection('teams').doc(teamId).get()
      
      if (!teamDoc.exists) {
        throw new Error('Team not found')
      }
      
      const teamData = teamDoc.data()
      
      // Verify caller is leader
      if (teamData.leaderId !== leaderId) {
        throw new Error('Only team leader can replace members')
      }
      
      // Check if team is locked
      if (teamData.state === this.TEAM_STATES.LOCKED) {
        throw new Error('Cannot replace members in a locked team')
      }
      
      // Check if new member is already in a team for this event
      const existingMemberSnapshot = await db.collection('teamMembers')
        .where('userId', '==', newMemberUserId)
        .where('eventId', '==', teamData.eventId)
        .where('status', '==', 'active')
        .get()
      
      if (!existingMemberSnapshot.empty) {
        throw new Error('New member is already part of a team in this event')
      }
      
      // Find old member
      const oldMemberSnapshot = await db.collection('teamMembers')
        .where('teamId', '==', teamId)
        .where('userId', '==', oldMemberUserId)
        .where('status', '==', 'active')
        .get()
      
      if (oldMemberSnapshot.empty) {
        throw new Error('Old member not found in team')
      }
      
      // Remove old member
      await oldMemberSnapshot.docs[0].ref.delete()
      
      // Add new member
      await db.collection('teamMembers').add({
        teamId,
        eventId: teamData.eventId,
        userId: newMemberUserId,
        role: 'member',
        status: 'active',
        joinedAt: new Date()
      })
      
      await teamDoc.ref.update({
        updatedAt: new Date()
      })
      
      return {
        success: true,
        message: 'Member replaced successfully'
      }
    } catch (error) {
      console.error('[TeamService.replaceMember] Error:', error.message)
      throw error
    }
  }

  // ==================== LOCK TEAM ====================
  
  /**
   * Lock team (happens after registration)
   * No more changes allowed
   */
  static async lockTeam(teamId) {
    try {
      const teamDoc = await db.collection('teams').doc(teamId).get()
      
      if (!teamDoc.exists) {
        throw new Error('Team not found')
      }
      
      const teamData = teamDoc.data()
      
      // Can only lock complete teams
      if (teamData.state !== this.TEAM_STATES.COMPLETE) {
        throw new Error('Only complete teams can be locked')
      }
      
      await teamDoc.ref.update({
        state: this.TEAM_STATES.LOCKED,
        lockedAt: new Date(),
        updatedAt: new Date()
      })
      
      return {
        success: true,
        state: this.TEAM_STATES.LOCKED
      }
    } catch (error) {
      console.error('[TeamService.lockTeam] Error:', error.message)
      throw error
    }
  }

  // ==================== GET TEAM ====================
  
  /**
   * Get team details with members
   */
  static async getTeam(teamId) {
    try {
      const teamDoc = await db.collection('teams').doc(teamId).get()
      
      if (!teamDoc.exists) {
        throw new Error('Team not found')
      }
      
      const teamData = teamDoc.data()
      
      // Get all members
      const membersSnapshot = await db.collection('teamMembers')
        .where('teamId', '==', teamId)
        .where('status', '==', 'active')
        .get()
      
      const members = []
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data()
        
        // Get user details
        const userDoc = await db.collection('users').doc(memberData.userId).get()
        const userData = userDoc.exists ? userDoc.data() : null
        
        members.push({
          id: memberDoc.id,
          userId: memberData.userId,
          role: memberData.role,
          joinedAt: memberData.joinedAt,
          user: {
            name: userData?.displayName || userData?.firstName,
            email: userData?.email,
            mobile: userData?.mobile
          }
        })
      }
      
      // Get pass type details (passes = sub-events)
      const passTypeDoc = await db.collection('pass_types').doc(teamData.eventId).get()
      const passTypeData = passTypeDoc.exists ? passTypeDoc.data() : null
      
      return {
        id: teamDoc.id,
        ...teamData,
        members,
        event: {
          id: teamData.eventId,
          name: passTypeData?.name,
          maxTeamSize: passTypeData?.maxTeamSize || teamData.maxSize
        }
      }
    } catch (error) {
      console.error('[TeamService.getTeam] Error:', error.message)
      throw error
    }
  }

  // ==================== GET USER TEAMS ====================
  
  /**
   * Get all teams user is part of
   */
  static async getUserTeams(userId) {
    try {
      const memberSnapshot = await db.collection('teamMembers')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get()
      
      const teams = []
      
      for (const memberDoc of memberSnapshot.docs) {
        const memberData = memberDoc.data()
        
        // Get team details
        const teamDoc = await db.collection('teams').doc(memberData.teamId).get()
        
        if (teamDoc.exists) {
          const teamData = teamDoc.data()
          
          // Get pass type details (passes = sub-events)
          const passTypeDoc = await db.collection('pass_types').doc(teamData.eventId).get()
          const passTypeData = passTypeDoc.exists ? passTypeDoc.data() : null
          
          teams.push({
            id: teamDoc.id,
            ...teamData,
            userRole: memberData.role,
            eventName: passTypeData?.name || 'Unknown',
            event: {
              id: teamData.eventId,
              name: passTypeData?.name
            }
          })
        }
      }
      
      return teams
    } catch (error) {
      console.error('[TeamService.getUserTeams] Error:', error.message)
      return []
    }
  }

  // ==================== DELETE TEAM (Leader only) ====================
  
  /**
   * Delete team (only if not locked)
   */
  static async deleteTeam(teamId, leaderId) {
    try {
      const teamDoc = await db.collection('teams').doc(teamId).get()
      
      if (!teamDoc.exists) {
        throw new Error('Team not found')
      }
      
      const teamData = teamDoc.data()
      
      // Verify caller is leader
      if (teamData.leaderId !== leaderId) {
        throw new Error('Only team leader can delete team')
      }
      
      // Cannot delete locked team
      if (teamData.state === this.TEAM_STATES.LOCKED) {
        throw new Error('Cannot delete a locked team')
      }
      
      // Delete all members
      const membersSnapshot = await db.collection('teamMembers')
        .where('teamId', '==', teamId)
        .get()
      
      const batch = db.batch()
      
      membersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      // Delete team
      batch.delete(teamDoc.ref)
      
      await batch.commit()
      
      return { success: true }
    } catch (error) {
      console.error('[TeamService.deleteTeam] Error:', error.message)
      throw error
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Calculate team state based on size
   */
  static calculateTeamState(currentSize, maxSize) {
    if (currentSize === 1) {
      return this.TEAM_STATES.DRAFT
    } else if (currentSize < maxSize) {
      return this.TEAM_STATES.PARTIAL
    } else if (currentSize === maxSize) {
      return this.TEAM_STATES.COMPLETE
    }
    return this.TEAM_STATES.PARTIAL
  }

  /**
   * Generate unique join code
   */
  static generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Validate team can register for event
   */
  static async validateTeamForRegistration(teamId) {
    try {
      const teamDoc = await db.collection('teams').doc(teamId).get()
      
      if (!teamDoc.exists) {
        return { valid: false, reason: 'Team not found' }
      }
      
      const teamData = teamDoc.data()
      
      // Team must be complete
      if (teamData.state !== this.TEAM_STATES.COMPLETE) {
        return {
          valid: false,
          reason: `Team must be complete to register. Current state: ${teamData.state}`
        }
      }
      
      // Check if pass/sub-event is still active
      const passTypeDoc = await db.collection('pass_types').doc(teamData.eventId).get()
      
      if (!passTypeDoc.exists) {
        return { valid: false, reason: 'Pass/sub-event not found' }
      }
      
      const passTypeData = passTypeDoc.data()
      
      if (passTypeData.active === false || passTypeData.isActive === false) {
        return { valid: false, reason: 'This pass/sub-event is not active' }
      }
      
      // Check if max teams reached (if set on pass type)
      if (passTypeData.maxTeams && passTypeData.teamCount >= passTypeData.maxTeams) {
        return { valid: false, reason: 'Maximum team capacity reached for this pass' }
      }
      
      return { valid: true }
    } catch (error) {
      console.error('[TeamService.validateTeamForRegistration] Error:', error.message)
      return { valid: false, reason: 'Error validating team' }
    }
  }
}
