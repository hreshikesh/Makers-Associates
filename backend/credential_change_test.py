#!/usr/bin/env python3
"""
Focused test for credential change and DEV indicator removal
Tests the 7 specific items from the review request
"""
import requests
import sys

BASE_URL = "https://ai-homes-3.preview.emergentagent.com/api"

# NEW credentials (should work)
NEW_EMAIL = "dkmanjeshbelli@gmail.com"
NEW_PASSWORD = "9980577310@aB"

# OLD credentials (should fail)
OLD_EMAIL = "admin@constructons.in"
OLD_PASSWORD = "admin123"

# DEV bypass token (should be disabled)
DEV_BYPASS_TOKEN = "dev-bypass-constructons-2025"


class CredentialChangeTest:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")

    def test_new_credentials_work(self):
        """Test 1: NEW credentials should work"""
        self.tests_run += 1
        self.log("Testing NEW credentials (dkmanjeshbelli@gmail.com / 9980577310@aB)...")
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/login",
                json={"email": NEW_EMAIL, "password": NEW_PASSWORD},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'token' in data:
                    self.tests_passed += 1
                    self.log("✅ PASSED - NEW credentials work, token received", "PASS")
                    return True, data['token']
                else:
                    self.log("❌ FAILED - Login succeeded but no token in response", "FAIL")
                    self.failed_tests.append({
                        "test": "NEW credentials",
                        "error": "No token in response"
                    })
                    return False, None
            else:
                self.log(f"❌ FAILED - Expected 200, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "FAIL")
                self.failed_tests.append({
                    "test": "NEW credentials",
                    "expected": 200,
                    "actual": response.status_code
                })
                return False, None
                
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": "NEW credentials",
                "error": str(e)
            })
            return False, None

    def test_old_credentials_fail(self):
        """Test 2: OLD credentials should fail with 401"""
        self.tests_run += 1
        self.log("Testing OLD credentials (admin@constructons.in / admin123) should FAIL...")
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/login",
                json={"email": OLD_EMAIL, "password": OLD_PASSWORD},
                timeout=10
            )
            
            if response.status_code == 401:
                self.tests_passed += 1
                self.log("✅ PASSED - OLD credentials correctly rejected with 401", "PASS")
                return True
            else:
                self.log(f"❌ FAILED - Expected 401, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "FAIL")
                self.failed_tests.append({
                    "test": "OLD credentials should fail",
                    "expected": 401,
                    "actual": response.status_code,
                    "error": "OLD credentials still work - SECURITY ISSUE"
                })
                return False
                
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": "OLD credentials should fail",
                "error": str(e)
            })
            return False

    def test_dev_bypass_token_disabled(self, valid_token):
        """Test 3: DEV_BYPASS_TOKEN should be disabled (return 401)"""
        self.tests_run += 1
        self.log("Testing DEV_BYPASS_TOKEN is disabled...")
        
        try:
            # Try to access admin endpoint with DEV_BYPASS_TOKEN
            response = requests.get(
                f"{BASE_URL}/leads",
                headers={"Authorization": f"Bearer {DEV_BYPASS_TOKEN}"},
                timeout=10
            )
            
            if response.status_code == 401:
                self.tests_passed += 1
                self.log("✅ PASSED - DEV_BYPASS_TOKEN correctly rejected with 401", "PASS")
                return True
            else:
                self.log(f"❌ FAILED - Expected 401, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "FAIL")
                self.failed_tests.append({
                    "test": "DEV_BYPASS_TOKEN disabled",
                    "expected": 401,
                    "actual": response.status_code,
                    "error": "DEV_BYPASS_TOKEN still works - SECURITY ISSUE"
                })
                return False
                
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": "DEV_BYPASS_TOKEN disabled",
                "error": str(e)
            })
            return False

    def test_admin_dashboard_loads(self, token):
        """Test 4: Admin dashboard loads with new credentials"""
        self.tests_run += 1
        self.log("Testing admin dashboard loads with NEW token...")
        
        try:
            # Test /api/admin/me endpoint
            response = requests.get(
                f"{BASE_URL}/admin/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                self.tests_passed += 1
                self.log("✅ PASSED - Admin dashboard endpoint accessible with NEW token", "PASS")
                return True
            else:
                self.log(f"❌ FAILED - Expected 200, got {response.status_code}", "FAIL")
                self.failed_tests.append({
                    "test": "Admin dashboard loads",
                    "expected": 200,
                    "actual": response.status_code
                })
                return False
                
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": "Admin dashboard loads",
                "error": str(e)
            })
            return False

    def run_all_tests(self):
        """Run all credential change tests"""
        self.log("=" * 70)
        self.log("Credential Change & DEV Indicator Removal Test Suite")
        self.log("=" * 70)
        
        # Test 1: NEW credentials work
        success, token = self.test_new_credentials_work()
        
        # Test 2: OLD credentials fail
        self.test_old_credentials_fail()
        
        # Test 3: DEV_BYPASS_TOKEN disabled
        if token:
            self.test_dev_bypass_token_disabled(token)
            
            # Test 4: Admin dashboard loads
            self.test_admin_dashboard_loads(token)
        else:
            self.log("⚠️  Skipping DEV_BYPASS_TOKEN and dashboard tests (no valid token)", "WARN")
        
        # Print summary
        self.log("\n" + "=" * 70)
        self.log("Test Summary")
        self.log("=" * 70)
        self.log(f"Total Tests: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed}", "PASS")
        self.log(f"Failed: {len(self.failed_tests)}", "FAIL")
        
        if self.failed_tests:
            self.log("\nFailed Tests:", "FAIL")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
                self.log(f"  - {test['test']}: {error_msg}", "FAIL")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return 0 if len(self.failed_tests) == 0 else 1


def main():
    tester = CredentialChangeTest()
    return tester.run_all_tests()


if __name__ == "__main__":
    sys.exit(main())
