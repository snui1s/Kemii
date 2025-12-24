
import requests

API_URL = "http://localhost:8000"

def test():
    # 1. Get Users
    try:
        res = requests.get(f"{API_URL}/users")
        users = res.json()
        print(f"Found {len(users)} users.")
        if not users:
            print("No users found. Run seed script.")
            return

        target_user = users[0]
        uid = target_user['id']
        print(f"Testing analysis for User ID: {uid} ({target_user['name']})")

        # 2. Call Analysis
        res = requests.get(f"{API_URL}/users/{uid}/analysis")
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print("Success! Analysis keys:", res.json().keys())
        else:
            print("Error Response:", res.text)

    except Exception as e:
        print(f"Script Error: {e}")

if __name__ == "__main__":
    test()
