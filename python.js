async function check_response(url, response) {
    
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
        }
    }
}

/*
def get_id(teamName):
    #check_requests()
    #global count
    focus = ""
    url1 = "http://api.football-data.org/v4/competitions/PL/teams"
    #count += 1
    response1 = requests.get(url1, headers=headers)
    response1 = response1.json()
    response = check_response(url1, response1)
    teamID = 0
    for team in response.get("teams"):
        if team["shortName"].lower() == teamName.lower():
            teamID = team["id"]
            focus = team["shortName"]
    #print(teamID)
    return teamID, focus
*/