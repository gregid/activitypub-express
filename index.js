'use strict'
const onFinished = require('on-finished')
const pub = require('./pub')
const net = require('./net')
const defaultStore = require('./store')

function onFinishedHandler (err, res) {
  if (err) return
  const apexLocal = res.locals.apex
  Promise.all(apexLocal.postWork.map(task => task.call(res)))
    .then(() => {
      if (apexLocal.eventName) {
        res.app.emit(apexLocal.eventName, apexLocal.eventMessage)
      }
    })
    .catch(err => console.error('post-response error:', err.message))
}

module.exports = function (settings) {
  const apex = function (req, res, next) {
    req.app.locals.apex = apex // apex api object
    res.locals.apex = {
      eventName: null,
      eventMessage: {},
      postWork: []
    }
    onFinished(res, onFinishedHandler)
    next()
  }
  // bind pub methods at top level so their 'this' is apex instance
  Object.assign(apex, pub)
  apex.settings = settings
  apex.domain = settings.domain
  apex.context = settings.context || pub.consts.ASContext
  apex.net = net
  apex.store = settings.store || defaultStore
  apex.actorParam = settings.actorParam
  apex.objectParam = settings.objectParam
  apex.activityParam = settings.activityParam
  apex.utils = {
    usernameToIRI: apex.idToIRIFactory(settings.domain, settings.routes.actor, settings.actorParam),
    objectIdToIRI: apex.idToIRIFactory(settings.domain, settings.routes.object, settings.objectParam),
    activityIdToIRI: apex.idToIRIFactory(settings.domain, settings.routes.activity, settings.activityParam),
    nameToActorStreams: apex.nameToActorStreamsFactory(settings.domain, settings.routes, settings.actorParam)
  }

  return apex
}
