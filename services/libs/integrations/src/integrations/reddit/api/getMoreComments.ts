import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from '../../nango'
import { IProcessStreamContext } from '@/types'
import { PlatformType } from '@crowd/types'
import { RedditMoreCommentsInput, RedditMoreCommentsResponse } from '../types'
import { timeout } from '@crowd/common'

/**
 * Expand a list of comment IDs into a comment tree.
 * This is needed because sometimes the API cuts the comment tree, and it returns a list of comment IDs to expand.
 * @param input It needs the Nango ID, the postId where the comments belong, and the IDs of the comments to expand.
 * @param logger A logger instance for structured logging
 * @returns Redit API's response to expand a list of comment IDs
 */
async function getMoreComments(
  input: RedditMoreCommentsInput,
  ctx: IProcessStreamContext,
): Promise<RedditMoreCommentsResponse> {
  try {
    ctx.log.info({ message: 'Fetching more comments from a sub-reddit', input })

    // Wait for 1.5s for rate limits.
    // eslint-disable-next-line no-promise-executor-return
    await timeout(1500)

    // Gett an access token from Nango
    const accessToken = await getNangoToken(input.nangoId, PlatformType.REDDIT, ctx)

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `http://oauth.reddit.com/api/morechildren?api_type=json`,
      params: {
        depth: 99,
        link_id: input.postId,
        children: input.children,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }

    const response: RedditMoreCommentsResponse = (await axios(config)).data
    return response
  } catch (err) {
    ctx.log.error({ err, input }, 'Error while getting posts in subreddit')
    throw err
  }
}

export default getMoreComments
