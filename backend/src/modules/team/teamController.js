import { TeamService } from './teamService.js'

export class TeamController {
  /**
   * Create team
   * POST /api/teams
   */
  static async createTeam(req, res, next) {
    try {
      const teamData = req.body
      const leaderId = req.user.uid
      
      const team = await TeamService.createTeam(teamData, leaderId)
      
      res.status(201).json({
        success: true,
        data: team,
        message: 'Team created successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Join team by code
   * POST /api/teams/join
   */
  static async joinTeam(req, res, next) {
    try {
      const { joinCode } = req.body
      const userId = req.user.uid
      
      const result = await TeamService.joinTeamByCode(joinCode, userId)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Successfully joined team'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Leave team
   * POST /api/teams/:id/leave
   */
  static async leaveTeam(req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user.uid
      
      const result = await TeamService.leaveTeam(id, userId)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Successfully left team'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Remove member (leader only)
   * DELETE /api/teams/:id/members/:memberId
   */
  static async removeMember(req, res, next) {
    try {
      const { id, memberId } = req.params
      const leaderId = req.user.uid
      
      const result = await TeamService.removeMember(id, memberId, leaderId)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Member removed successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Replace member (leader only)
   * POST /api/teams/:id/replace-member
   */
  static async replaceMember(req, res, next) {
    try {
      const { id } = req.params
      const { oldMemberId, newMemberId } = req.body
      const leaderId = req.user.uid
      
      const result = await TeamService.replaceMember(id, oldMemberId, newMemberId, leaderId)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Member replaced successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get team details
   * GET /api/teams/:id
   */
  static async getTeam(req, res, next) {
    try {
      const { id } = req.params
      
      const team = await TeamService.getTeam(id)
      
      res.status(200).json({
        success: true,
        data: team
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user's teams
   * GET /api/teams/my-teams
   */
  static async getMyTeams(req, res, next) {
    try {
      const userId = req.user.uid
      
      const teams = await TeamService.getUserTeams(userId)
      
      res.status(200).json({
        success: true,
        data: teams
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete team (leader only)
   * DELETE /api/teams/:id
   */
  static async deleteTeam(req, res, next) {
    try {
      const { id } = req.params
      const leaderId = req.user.uid
      
      await TeamService.deleteTeam(id, leaderId)
      
      res.status(200).json({
        success: true,
        message: 'Team deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Lock team (admin)
   * POST /api/teams/:id/lock
   */
  static async lockTeam(req, res, next) {
    try {
      const { id } = req.params
      
      const result = await TeamService.lockTeam(id)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Team locked successfully'
      })
    } catch (error) {
      next(error)
    }
  }
}
