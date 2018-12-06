

	
function sendTrade(participants, uaids) {
		return new Promise((resolve, reject) => {
			let json = {
				AgentOfferList: [
					{
						AgentID: participants[0],
						OfferList: [
							{
								UserAssetID: uaids[0]
							}
						],
						OfferRobux: 0,
						OfferValue: 1
					},
					{
						AgentID: participants[1],
						OfferList: [
							{
								UserAssetID: uaids[1]
							}
						],
						OfferRobux: 0,
						OfferValue: 1
					}
				],
				isActive: false,
				TradeStatus: "Open"
			}

			request({
				url: "https://www.roblox.com/Trade/tradehandler.ashx",
				method: 'POST',
				headers: {
					'X-CSRF-TOKEN': this.token
				},
				form: {
					cmd: 'send',
					TradeJSON: JSON.stringify(json)
				}
			}, (err, resp, body) => {
				if(err) return reject(err);
				if(resp.statusCode != 200) return reject(new Error('Request failed.'));
				resolve(JSON.parse(body)['msg'] == "Trade sent!");
			});
		});
	}

// Includes
var http = require('../util/http.js').func
var getGeneralToken = require('../util/getGeneralToken.js').func

// Args
exports.required = ['group', 'member', 'amount']
exports.optional = ['recurring', 'usePercentage', 'jar']

// Define
function groupPayout (jar, token, group, data, recurring, usePercentage) {
  var httpOpt = {
    url: '//www.roblox.com/groups/' + group + (recurring === true ? '/recurring-payout' : ('/one-time-payout/' + (usePercentage === true ? 'true' : 'false'))),
    options: {
      resolveWithFullResponse: true,
      method: 'POST',
      jar: jar,
      headers: {
        'X-CSRF-TOKEN': token
      },
      form: {
        percentages: JSON.stringify(data)
      }
    }
  }
  return http(httpOpt)
    .then(function (res) {
      if (res.statusCode !== 200) {
        throw new Error(res.statusMessage)
      }
    })
}

// Although I would normally leave it to the endpoint to error when incorrect percentages are given, it's not very reliable so I'll do it instead
function isPercentage (num) {
  if (num >= 0 && num <= 100 && num % 1 === 0) {
    return true
  } else {
    return false
  }
}

exports.func = function (args) {
  var jar = args.jar
  var member = args.member
  var amount = args.amount
  var recurring = args.recurring
  var usePercentage = recurring ? true : args.usePercentage
  var data = {}

  if (!(member instanceof Array)) {
    member = [member]
    amount = [amount]
  } else if (!(amount instanceof Array) || member.length !== amount.length) {
    throw new Error('If member is an array amount must be a parallel array')
  }
  var total = 0
  for (var i = 0; i < member.length; i++) {
    var value = amount[i]
    if (usePercentage) {
      if (!isPercentage(value)) {
        throw new Error('Percent values must be whole numbers between 0 and 100 inclusive')
      }
      total += value
      if (total > 100) {
        throw new Error('Sum of percent values must be less than 100')
      }
    }
    data[member[i]] = value
  }

  return getGeneralToken({jar: jar})
    .then(function (xcsrf) {
      return groupPayout(jar, xcsrf, args.group, data, recurring, usePercentage)
    })
}
