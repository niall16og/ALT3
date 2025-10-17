async function get_data(T1, T2) {
	console.log("wait");
	try {
		let response1 = await fetch(`https://niall16og.pythonanywhere.com/api/get_data/${T1}/${T2}`)
		.then(response => response.json());
		console.log(response1);
		const team1 = response1.team1;
		const team2 = response1.team2;
		const h2h = response1.h2h;
		console.log(team1);
		return response1;
	} catch (e) {
		console.error(e);
	}
	
	
	console.log("done");
	
}


function calculate_form_rating(results) {
    let form_rating = 0;
    const weights = [1.5, 1.3, 1.1, 0.9, 0.7];
    
    for (let i = 0; i<results.length; i++) {
        if (results[i] === 'W') {
            form_rating += 3 * weights[i];
		} else if (results[i] === 'D') {
            form_rating += 1 * weights[i];
		}
	}
    return form_rating;
}

async function analyze_teams(T1, T2) {
    
	const response = await get_data(T1, T2);
	console.log(response);
    const { team1: T1Res, team2: T2Res, h2h} = response;
    const T1_results = T1Res.last5;
    const T2_results = T2Res.last5;

	//const T1_points = calculate_points(T1_results);
    //const T2_points = calculate_points(T2_results);
    
    let T1_form = calculate_form_rating(T1_results);
    let T2_form = calculate_form_rating(T2_results);
    
    const T1_wins = T1_results.filter(result => result === "W").length;
    const T1_draws = T1_results.filter(result => result === "D").length;
    const T1_losses = T1_results.filter(result => result === "L").length;
    
    const T2_wins = T2_results.filter(result => result === "W").length;
    const T2_draws = T2_results.filter(result => result === "D").length;
    const T2_losses = T2_results.filter(result => result === "L").length;
    
    const T1_name = T1Res.Name;
    const T2_name = T2Res.Name;
    
    let home;
    const homeNo = 1;
    if (homeNo === 1) {
        home = T1_name;
        const homePPG = T1Res.ppg.home;
        T1_form = (T1_form*0.85) + (homePPG*0.15);
        const awayPPG = T2Res.ppg.away;
        T2_form = (T2_form*0.85) + (awayPPG*0.15);
	} else{
        home = T2_name;
        const homePPG = T2Res.ppg.home;
        T2_form = (T2_form*0.85) + (homePPG*0.15);
        const awayPPG = T1Res.ppg.away;
        T1_form = (T1_form*0.85) + (awayPPG*0.15);
	}
    
    if (h2h.toLowerCase() === T1_name.toLowerCase()) {
        T1_form += 1;
	} else if (h2h.toLowerCase() === T2_name.toLowerCase()) {
        T2_form += 1;
	}
    
    console.log(`=== ${T1_name.toUpperCase()} vs ${T2_name.toUpperCase()} ANALYSIS ===`);
    console.log(`\n${T1_name}'s Last 5 Results: ${T1_results}`);
    console.log(`Wins: ${T1_wins}, Draws: ${T1_draws}, Losses: ${T1_losses}`);
    console.log(`Form Rating: ${T1_form.toFixed(2)}`);
    
    console.log(`\n${T2_name}'s Last 5 Results: ${T2_results}`);
    console.log(`Wins: ${T2_wins}, Draws: ${T2_draws}, Losses: ${T2_losses}`);
    console.log(`Form Rating: ${T2_form.toFixed(2)}`);
    
    console.log(`\n=== PROBABILITY ANALYSIS ===`);
    
	let better_team, worse_team, form_difference, base_probability, worse_probability, draw_probability;
    if (T1_form > T2_form) {
        better_team = T1_name;
        worse_team = T2_name;
        form_difference = T1_form - T2_form;
        base_probability = 50 + (form_difference * 5);
        worse_probability = 50 - (form_difference * 5);
	} else if (T2_form > T1_form) {
        better_team = T2_name;
        worse_team = T1_name;
        form_difference = T2_form - T1_form;
        base_probability = 50 + (form_difference * 5);
        worse_probability = 50 - (form_difference * 5);
	} else {
        better_team = T1_name;
        worse_team = T2_name;
        form_difference = 0;
        base_probability = 33;
        worse_probability = 33;
        draw_probability = 34;
	}

    const probability = Math.max(10, Math.min(90, base_probability)) - 17;
    const probability2 = Math.max(10, Math.min(90, worse_probability)) - 17;
    const probability3 = 34;
    console.log(`Home Team: ${home}`);
    console.log(`Form Difference: ${Math.abs(parseFloat(form_difference.toFixed(2)))}`);
    console.log(`Estimated Probability of ${better_team} Winning: ${probability.toFixed(1)}%`);
    console.log(`Estimated Probability of ${worse_team} Winning: ${probability2.toFixed(1)}%`);
    console.log(`Estimated Probability of Draw: ${probability3.toFixed(1)}%`);
	/*const l1 = `Home Team: ${home}`;
	const l2 = `Form Difference: ${Math.abs(parseFloat(form_difference.toFixed(2)))}`;
	const l3 = `Estimated Probability of ${better_team} Winning: ${probability.toFixed(1)}%`;
	const l4 = `Estimated Probability of ${worse_team} Winning: ${probability2.toFixed(1)}%`;
	const l5 = `Estimated Probability of Draw: ${probability3.toFixed(1)}%`;
	const lines = [];
	lines.push(l1,l2,l3,l4,l5);
	return lines;*/
    return {
        homeWin: probability.toFixed(1),
        form: Math.abs(parseFloat(form_difference.toFixed(2))),
        draw: probability3.toFixed(1),
        away: probability2.toFixed(1),
        crest1: T1Res.crest,
        crest2: T2Res.crest
    };
}

async function submitTeams() {
    const overlay = document.querySelector("#overlay");
    overlay.style.display = "flex";
	const T1 = document.querySelector("#T1").value.trim();
	const T2 = document.querySelector("#T2").value.trim();
	//const output = document.querySelector("#outputs");
    const homeWin = document.querySelector("#homeWin");
    const awayWin = document.querySelector("#awayWin");
    const form = document.querySelector("#form");
    const drawRes = document.querySelector("#drawRes");
    const homeImg = document.querySelector("#team1 img");
    const awayImg = document.querySelector("#team2 img");
    const data = await analyze_teams(T1, T2);
    homeWin.textContent = data.homeWin;
    awayWin.textContent = data.away;
    form.textContent = data.form;
    drawRes.textContent = data.draw;
    homeImg.src = data.crest1;
    awayImg.src = data.crest2;
    /*output.innerHTML = "";
	const lines = await analyze_teams(T1, T2);
	lines.forEach(line => output.innerHTML += `${line}<br>`);*/
    overlay.style.display = "none";
}


//analyze_teams();



