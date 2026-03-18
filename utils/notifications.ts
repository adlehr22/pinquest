import { getSupabaseClient } from '@/lib/supabase'

export async function notifyNewFollower(
  followedUserId: string,
  followerUsername: string,
) {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.from('notifications').insert({
    user_id: followedUserId,
    type: 'new_follower',
    message: `@${followerUsername} started following you! 👋`,
    link: '/leaderboard',
  })
}

export async function notifyGameCompleted(
  userId: string,
  userScore: number,
  today: string,
) {
  const supabase = getSupabaseClient()
  if (!supabase) return

  // Count players with a higher score to determine rank
  const { data: above } = await supabase
    .from('games')
    .select('id')
    .eq('played_date', today)
    .gt('total_score', userScore)

  const rank = (above?.length ?? 0) + 1

  if (rank <= 3) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'top_three',
      message: `You're #${rank} on today's leaderboard! 🏆`,
      link: '/leaderboard',
    })
  }

  // Check if any followed users beat the score today
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (!following?.length) return

  const followingIds = following.map((f: { following_id: string }) => f.following_id)

  const { data: friendGames } = await supabase
    .from('games')
    .select(`
      total_score,
      profiles!inner (
        username
      )
    `)
    .in('user_id', followingIds)
    .eq('played_date', today)
    .gt('total_score', userScore)

  if (!friendGames?.length) return

  type FriendGame = {
    total_score: number
    profiles: { username: string } | { username: string }[]
  }

  const inserts = (friendGames as unknown as FriendGame[]).map((game) => {
    const p = Array.isArray(game.profiles) ? game.profiles[0] : game.profiles
    return {
      user_id: userId,
      type: 'friend_beat_score',
      message: `@${p.username} beat your score! ${game.total_score.toLocaleString()} vs your ${userScore.toLocaleString()} 🎯`,
      link: '/leaderboard',
    }
  })

  if (inserts.length > 0) {
    await supabase.from('notifications').insert(inserts)
  }
}
