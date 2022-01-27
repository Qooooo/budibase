const rowController = require("../../../controllers/row")
const appController = require("../../../controllers/application")
const { AppStatus } = require("../../../../db/utils")
const { BUILTIN_ROLE_IDS } = require("@budibase/backend-core/roles")
const { TENANT_ID } = require("../../../../tests/utilities/structures")
const { getAppDB } = require("@budibase/backend-core/context")

function Request(appId, params) {
  this.appId = appId
  this.params = params
  this.request = {}
}

exports.getAllTableRows = async config => {
  const req = new Request(config.appId, { tableId: config.table._id })
  await rowController.fetch(req)
  return req.body
}

exports.clearAllApps = async (tenantId = TENANT_ID) => {
  const req = { query: { status: AppStatus.DEV }, user: { tenantId } }
  await appController.fetch(req)
  const apps = req.body
  if (!apps || apps.length <= 0) {
    return
  }
  for (let app of apps) {
    const { appId } = app
    await appController.delete(new Request(null, { appId }))
  }
}

exports.clearAllAutomations = async config => {
  const automations = await config.getAllAutomations()
  for (let auto of automations) {
    await config.deleteAutomation(auto)
  }
}

exports.createRequest = (request, method, url, body) => {
  let req

  if (method === "POST") req = request.post(url).send(body)
  else if (method === "GET") req = request.get(url)
  else if (method === "DELETE") req = request.delete(url)
  else if (method === "PATCH") req = request.patch(url).send(body)
  else if (method === "PUT") req = request.put(url).send(body)

  return req
}

exports.checkBuilderEndpoint = async ({ config, method, url, body }) => {
  const headers = await config.login({
    userId: "us_fail",
    builder: false,
    prodApp: true,
  })
  await exports
    .createRequest(config.request, method, url, body)
    .set(headers)
    .expect(403)
}

exports.checkPermissionsEndpoint = async ({
  config,
  method,
  url,
  body,
  passRole,
  failRole,
}) => {
  const passHeader = await config.login({
    roleId: passRole,
    prodApp: true,
  })

  await exports
    .createRequest(config.request, method, url, body)
    .set(passHeader)
    .expect(200)

  let failHeader
  if (failRole === BUILTIN_ROLE_IDS.PUBLIC) {
    failHeader = config.publicHeaders({ prodApp: true })
  } else {
    failHeader = await config.login({
      roleId: failRole,
      builder: false,
      prodApp: true,
    })
  }

  await exports
    .createRequest(config.request, method, url, body)
    .set(failHeader)
    .expect(403)
}

exports.getDB = () => {
  return getAppDB()
}

exports.testAutomation = async (config, automation) => {
  return await config.request
    .post(`/api/automations/${automation._id}/test`)
    .send({
      row: {
        name: "Test",
        description: "TEST",
      },
    })
    .set(config.defaultHeaders())
    .expect("Content-Type", /json/)
    .expect(200)
}
