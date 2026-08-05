// simple in-memory store (replace with DB later)
const events = [
    {
        "id": 1,
        "title": "New Event",
        "date": "2026-08-05",
        "location": "Online",
        "description": "Sample Event",
        "maxCapacity": 4,
        "attendees": [
            {
                "id": 1,
                "name": "User 99",
                "email": "user99@gmail.com"
            },
            {
                "id": 2,
                "name": "sachin",
                "email": "sachin@gmail.com"
            },
            {
                "id": 3,
                "name": "Rahul",
                "email": "rahul@gmail.com"
            },
            {
                "id": 4,
                "name": "Kapil",
                "email": "kapil@gmail.com"
            }
        ]
    },
    {
        "id": 3,
        "title": "Event 3",
        "date": "2026-08-05",
        "location": "Mumbai",
        "description": "Cloud Event",
        "maxCapacity": 10,
        "attendees": []
    },
    {
        "id": 4,
        "title": "AI Summit 2027",
        "date": "2027-01-20",
        "location": "Singapore",
        "description": "All inclusive AI Event",
        "maxCapacity": 50,
        "attendees": []
    }
]

module.exports = events
