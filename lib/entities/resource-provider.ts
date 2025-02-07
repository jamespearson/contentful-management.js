import type { BasicMetaSysProps, DefaultElements, MakeRequest, SysLink } from '../common-types'
import { toPlainObject, freezeSys } from 'contentful-sdk-core'
import copy from 'fast-copy'
import enhanceWithMethods from '../enhance-with-methods'

export type ResourceProviderProps = {
  /**
   * System metadata
   */
  sys: Omit<BasicMetaSysProps, 'version'> & {
    organization: SysLink
    appDefinition: SysLink
  }
  /**
   * Resource Provider type, value is 'function'
   */
  type: 'function'
  /**
   * Link to a Contentful function
   */
  function: SysLink
}

export type UpsertResourceProviderProps = Omit<ResourceProviderProps, 'sys'> & {
  sys: { id: string }
}

export interface ResourceProvider
  extends ResourceProviderProps,
    DefaultElements<ResourceProviderProps> {
  upsert(): Promise<ResourceProvider>
  delete(): Promise<void>
}

/**
 * @private
 */
function createResourceProviderApi(makeRequest: MakeRequest) {
  return {
    /**
     * Sends an update to the server with any changes made to the object's properties
     * @return Object returned from the server with updated changes.
     * @example ```javascript
     * const contentful = require('contentful-management')
     *
     * const client = contentful.createClient({
     *   accessToken: '<content_management_api_key>'
     * })
     *
     * client.getOrganization('<org_id>')
     * .then((org) => org.getAppDefinition('<app_def_id>'))
     * .then((appDefinition) => appDefinition.getResourceProvider())
     * .then((resourceProvider) => {
     *    resourceProvider.function.sys.id = '<new_contentful_function_id>'
     *    return resourceProvider.upsert()
     * })
     * .catch(console.error)
     * ```
     */
    upsert: function upsert() {
      const data = this.toPlainObject() as ResourceProviderProps
      return makeRequest({
        entityType: 'ResourceProvider',
        action: 'upsert',
        params: getParams(data),
        headers: {},
        payload: getUpsertParams(data),
      }).then((data) => wrapResourceProvider(makeRequest, data))
    },
    /**
     * Deletes this object on the server.
     * @return Promise for the deletion. It contains no data, but the Promise error case should be handled.
     * @example ```javascript
     * const contentful = require('contentful-management')
     *
     * const client = contentful.createClient({
     *   accessToken: '<content_management_api_key>'
     * })
     *
     * client.getOrganization('<org_id>')
     * .then((org) => org.getAppDefinition('<app_def_id>'))
     * .then((appDefinition) => appDefinition.getResourceProvider())
     * .then((resourceProvider) => resourceProvider.delete())
     * .catch(console.error)
     * ```
     */
    delete: function del() {
      const data = this.toPlainObject() as ResourceProviderProps
      return makeRequest({
        entityType: 'ResourceProvider',
        action: 'delete',
        params: getParams(data),
      })
    },
  }
}
/**
 * @private
 * @param data - raw ResourceProvider Object
 * @return Object containing the http params for the ResourceProvider request: organizationId and appDefinitionId
 */
const getParams = (data: ResourceProviderProps) => ({
  organizationId: data.sys.organization.sys.id,
  appDefinitionId: data.sys.appDefinition.sys.id,
})
/**
 * @private
 * @param data - raw ResourceProvider Object
 * @return UpsertResourceProviderProps
 */
const getUpsertParams = (data: ResourceProviderProps): UpsertResourceProviderProps => ({
  sys: { id: data.sys.id },
  type: data.type,
  function: data.function,
})

/**
 * @private
 * @param makeRequest - function to make requests via an adapter
 * @param data - Raw Resource Provider data
 * @return Wrapped Resource Provider data
 */
export function wrapResourceProvider(
  makeRequest: MakeRequest,
  data: ResourceProviderProps
): ResourceProvider {
  const resourceProvider = toPlainObject(copy(data))
  const ResourceProviderWithMethods = enhanceWithMethods(
    resourceProvider,
    createResourceProviderApi(makeRequest)
  )
  return freezeSys(ResourceProviderWithMethods)
}
