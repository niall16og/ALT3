function sleep(seconds) {
	return new Promise(resolve => setTimeout(resolve, seconds*1000));
}

async function check_response(url, response) {
    if ("message" in response && "errorCode" in response) {
		if (response.errorCode === 429) {
			const timeToWait = Number(response.message.slice(37,39));
			console.log(`Getting data...\nThis will take about ${timeToWait} second(s)`);
			await sleep(timeToWait + 2);
			const new_response = await fetch(url, {
				method: "GET",
				headers: {"X-Auth-Token":"d77a6c2ae26f49dcbcd786a9aac82175"}
			})
			.then(response => response.json())
			.then(response => check_response(url, response));
			return new_response;
		}
	}
}

async function get_id(teamName) {
    let focus;
    const url1 = "http://api.football-data.org/v4/competitions/PL/teams";
    let response1 = await fetch(url1, {
        method: "GET",
        headers: {"X-Auth-Token":"d77a6c2ae26f49dcbcd786a9aac82175"}
    })
    .then(response => response.json())
    .then(response => check_response(url1, response));
    let teamID;
    for (const team in response.teams) {
        if (team.shortName.toLowerCase() === teamName.toLowerCase()) {
            teamID = team.id;
			focus = team.shortName;
        }
    }
	return teamID, focus;
}

async function get_games(teamID) {
	const url2 = `http://api.football-data.org/v4/teams/${teamID}/matches/?limit=5&season=2025&competitions=2021&status=FINISHED`;
	let matchList = await fetch(url2, {
        method: "GET",
        headers: {"X-Auth-Token":"d77a6c2ae26f49dcbcd786a9aac82175"}
    })
    .then(response => response.json())
    .then(response => check_response(url2, response));
	const matches = matchList.matches;
	return matches;
}

async function get_h2h(teamID1, teamID2) {
	let date = new Date();
	date = date.toISOString().split('T')[0];
	while (true) {
		let dateFrom = new Date(date);
		dateFrom.setDate(dateFrom.getDate() - 30); // Subtracts days
		let year = date.getFullYear();
		let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
		let day = String(date.getDate()).padStart(2, '0');
		dateFrom = `${year}-${month}-${day}`;
		const url3 = `http://api.football-data.org/v4/teams/${teamID1}/matches/?status=FINISHED&dateFrom=${dateFrom}&dateTo=${date}`;
		const matchList = await fetch(url3, {
			method: "GET",
			headers: {"X-Auth-Token":"d77a6c2ae26f49dcbcd786a9aac82175"}
		})
		.then(response => response.json())
		.then(response => check_response(url3, response));
		const matches = matchList.matches;
		date = dateFrom;
		for (const match in matches) {
			const homeID = match.homeTeam.id;
			const awayID = match.awayTeam.id;
			let home, away;
			if (homeID === teamID1) {
				home = teamID1;
			} else if (homeID === teamID2) {
				home = teamID2;
			}
			if (awayID === teamID1) {
				away = teamID1;
			} else if (awayID === teamID2) {
				away = teamID2;
			}
			if (!home || !away) {
				continue;
			}
			const score = match.score;
			const homeScore = score.fulltime.home;
			const awayScore = score.fulltime.away;
			const winner = score.winner;
			const homeName = match.homeTeam.shortName;
			const awayName = match.awayTeam.shortName;
			if (winner === "HOME_TEAM") {
                console.log(`${homeName} (id:${home}) ${homeScore} goal(s) dft ${awayName} (id:${away}) ${awayScore} goal(s)`);
                let win = homeName;
            } else if (winner === "AWAY_TEAM"){
                console.log(`${awayName} (id:${away}) ${awayScore} goal(s) dft ${homeName} (id:${home}) ${homeScore} goal(s)`);
                win = awayName;
            } else {
                console.log(`${homeName} (id:${home}) ${homeScore} goal(s) draws ${awayName} (id:${away}) ${awayScore} goal(s)`);
                win = "DRAW";
			}
            return win;
		}
	}
}

async function get_ppg(teamID) {
	const url4 = `http://api.football-data.org/v4/teams/${teamID}/matches/?season=2025&competitions=2021&status=FINISHED`;
	const response = await fetch(url4, {
        method: "GET",
        headers: {"X-Auth-Token":"d77a6c2ae26f49dcbcd786a9aac82175"}
    })
    .then(response => response.json())
    .then(response => check_response(url4, response));
	const matches = response.matches;
	let homeM, homeP, awayM, awayP;
	for (const match in matches) {
		const winner = match.score.winner;
		if (match.homeTeam.id === teamID) {
			homeM += 1;
			if (winner === "HOME_TEAM") {
				homeP += 3;
			} else if (winner === "DRAW") {
				homeP += 1;
			}
		} else if (match.awayTeam.id === teamID) {
			awayM += 1;
			if (winner === "AWAY_TEAM") {
				awayP += 3;
			} else if (winner === "DRAW") {
				awayP += 1;
			}
		}
		const homePPG = Math.round((homeP/homeM)*100)/100;
		const awayPPG = Math.round((awayP/awayM)*100)/100;
		console.log(`Home PPG: ${homePPG} | Away PPG: ${awayPPG}`);
		return {"home": homePPG, "away": awayPPG};
	}
}

async function get_last5(matches, focus) {
	const last5 = [];
	for (const game in matches) {
		let check;
		const home = game.homeTeam.shortName;
		const away = game.homeTeam.shortName;
		if (home === focus) {
			check = home;
		} else if (away === focus) {
			check = away;
		}
		const winner = game.score.winner;
		if ((winner === "HOME_TEAM" && check === home) || (winner === "AWAY_TEAM" && check === away)){
            last5.push("W");
        } else if ((winner === "HOME_TEAM" && check === away) || (winner === "AWAY_TEAM" && check === home)){
            last5.push("L");
        } else if (winner == "DRAW") {
            last5.push("D");
		}
	}
	console.log(last5);
	return last5;
}

async function get_data() {
	const teamName1 = "liverpool";
	const {id1, focus1} = await get_id(teamName1);
	const games1 = await get_games(id1);
	const last5_1 = await get_last5(games1, focus1);
	const ppg1 = await get_ppg(id1);
	const teamName2 = "arsenal";
	const {id2, focus2} = await get_id(teamName2);
	const games2 = await get_games(id2);
	const last5_2 = await get_last5(games2, focus2);
	const ppg2 = await get_ppg(id2);
	const h2h = await get_h2h(id1, id2);
	return {
		name: teamName1,
		last5: last5_1,
		ppg: ppg1
	}, {
		name: teamName2,
		last5: last5_2,
		ppg: ppg2
	}, h2h;
}

const {liv, man, head} = get_data();

console.log(liv);