"""
Client Proposals Backend Testing
Tests all backend endpoints for client proposals CRUD + PDF generation.
"""
import requests
import sys
from datetime import datetime

BASE_URL = "https://ai-homes-3.preview.emergentagent.com/api"
ADMIN_EMAIL = "dkmanjeshbelli@gmail.com"
ADMIN_PASSWORD = "9980577310@aB"

class ProposalsBackendTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.test_results = []
        self.test_proposal_id = None
        self.test_ref_number = None

    def log_test(self, name, passed, details=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ PASS: {name}")
        else:
            print(f"❌ FAIL: {name}")
        if details:
            print(f"   {details}")
        self.test_results.append({"name": name, "passed": passed, "details": details})

    def admin_login(self):
        """Login as admin to access leads endpoint"""
        print("\n🔐 Logging in as admin...")
        try:
            response = requests.post(f"{BASE_URL}/admin/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                print(f"✅ Admin login successful, token: {self.admin_token[:20]}...")
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return False

    def test_brochure_basic_package(self):
        """Test POST /api/packages/basic/brochure with name+phone+city"""
        print("\n📋 Test OLD: POST /api/packages/basic/brochure (skipped - old test)")
        # Skipped - this is from old phase 4 testing
        pass

    def test_brochure_premium_required_only(self):
        """Test POST /api/packages/premium/brochure with only required fields"""
        print("\n📋 Test OLD: POST /api/packages/premium/brochure (skipped - old test)")
        # Skipped - this is from old phase 4 testing
        pass

    def test_brochure_invalid_package(self):
        """Test POST /api/packages/invalid/brochure returns 404"""
        print("\n📋 Test OLD: POST /api/packages/invalid/brochure (skipped - old test)")
        # Skipped - this is from old phase 4 testing
        pass

    def test_lead_creation_after_brochure(self, quote_ref):
        """Test that lead is created after brochure download"""
        print("\n📋 Test OLD: Lead creation verification (skipped - old test)")
        # Skipped - this is from old phase 4 testing
        pass

    def test_recommend_premium_budget(self):
        """Test POST /api/recommend with premium budget → standard tier"""
        print("\n📋 Test OLD: POST /api/recommend (skipped - old test)")
        # Skipped - this is from old phase 4 testing
        pass

    def test_recommend_value_budget(self):
        """Test POST /api/recommend with value budget → basic tier"""
        print("\n📋 Test OLD: POST /api/recommend (skipped - old test)")
        # Skipped - this is from old phase 4 testing
        pass

    def test_recommend_luxury_budget(self):
        """Test POST /api/recommend with luxury budget → premium tier"""
        print("\n📋 Test OLD: POST /api/recommend (skipped - old test)")
        # Skipped - this is from old phase 4 testing
        pass

    def test_list_proposals_empty(self):
        """Test GET /api/proposals returns empty list initially"""
        print("\n📋 Test 1: GET /api/proposals (should be empty or have existing items)")
        try:
            response = requests.get(
                f"{BASE_URL}/proposals",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            
            status_ok = response.status_code == 200
            if status_ok:
                data = response.json()
                is_list = isinstance(data, list)
                details = f"Status: {response.status_code}, Count: {len(data) if is_list else 'N/A'}"
                self.log_test("List proposals endpoint", status_ok and is_list, details)
            else:
                self.log_test("List proposals endpoint", False, f"Status: {response.status_code}, Body: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("List proposals endpoint", False, f"Error: {str(e)}")

    def test_create_proposal_valid(self):
        """Test POST /api/proposals with valid data"""
        print("\n📋 Test 2: POST /api/proposals with valid data")
        try:
            payload = {
                "status": "draft",
                "valid_days": 30,
                "client_name": "Test Client",
                "client_phone": "9999999999",
                "client_email": "test@example.com",
                "client_address": "123 Test Street, Bangalore",
                "site_address": "Plot 456, Test Layout",
                "plot_area": 2400,
                "floors": "G+1",
                "built_up_area": 1500,
                "package_slug": "essential",
                "addons_selected": [],
                "discount_amount": 0,
                "gst_percent": 18
            }
            
            response = requests.post(
                f"{BASE_URL}/proposals",
                json=payload,
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            
            status_ok = response.status_code == 200
            if status_ok:
                data = response.json()
                has_id = "id" in data
                has_ref = "ref_number" in data
                ref_format_ok = data.get("ref_number", "").startswith("CON-2026-") if has_ref else False
                
                if has_id:
                    self.test_proposal_id = data["id"]
                if has_ref:
                    self.test_ref_number = data["ref_number"]
                
                all_ok = status_ok and has_id and has_ref and ref_format_ok
                details = f"Status: {response.status_code}, ID: {data.get('id', 'N/A')[:8]}..., Ref: {data.get('ref_number', 'N/A')}"
                self.log_test("Create proposal with valid data", all_ok, details)
            else:
                self.log_test("Create proposal with valid data", False, f"Status: {response.status_code}, Body: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("Create proposal with valid data", False, f"Error: {str(e)}")

    def test_create_proposal_missing_required(self):
        """Test POST /api/proposals with missing required fields"""
        print("\n📋 Test 3: POST /api/proposals with missing client_name (should fail)")
        try:
            payload = {
                "client_phone": "9999999999",
                "built_up_area": 1500,
                "package_slug": "essential"
            }
            
            response = requests.post(
                f"{BASE_URL}/proposals",
                json=payload,
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            
            # Should return 422 (validation error)
            status_ok = response.status_code == 422
            details = f"Status: {response.status_code}"
            self.log_test("Create proposal with missing required fields", status_ok, details)
                
        except Exception as e:
            self.log_test("Create proposal with missing required fields", False, f"Error: {str(e)}")

    def test_get_proposal_by_id(self):
        """Test GET /api/proposals/{id}"""
        print("\n📋 Test 4: GET /api/proposals/{id}")
        if not self.test_proposal_id:
            self.log_test("Get proposal by ID", False, "No test proposal ID available")
            return
            
        try:
            response = requests.get(
                f"{BASE_URL}/proposals/{self.test_proposal_id}",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            
            status_ok = response.status_code == 200
            if status_ok:
                data = response.json()
                has_fields = all(k in data for k in ["id", "ref_number", "client_name", "package_slug"])
                details = f"Status: {response.status_code}, Ref: {data.get('ref_number', 'N/A')}"
                self.log_test("Get proposal by ID", status_ok and has_fields, details)
            else:
                self.log_test("Get proposal by ID", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get proposal by ID", False, f"Error: {str(e)}")

    def test_update_proposal(self):
        """Test PUT /api/proposals/{id}"""
        print("\n📋 Test 5: PUT /api/proposals/{id}")
        if not self.test_proposal_id:
            self.log_test("Update proposal", False, "No test proposal ID available")
            return
            
        try:
            payload = {
                "status": "sent",
                "client_name": "Test Client Updated",
                "client_phone": "9999999999",
                "built_up_area": 1800,
                "package_slug": "essential",
                "discount_amount": 50000,
                "gst_percent": 18
            }
            
            response = requests.put(
                f"{BASE_URL}/proposals/{self.test_proposal_id}",
                json=payload,
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            
            status_ok = response.status_code == 200
            if status_ok:
                data = response.json()
                updated_ok = data.get("status") == "sent" and data.get("built_up_area") == 1800
                details = f"Status: {response.status_code}, Updated status: {data.get('status')}, Area: {data.get('built_up_area')}"
                self.log_test("Update proposal", status_ok and updated_ok, details)
            else:
                self.log_test("Update proposal", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Update proposal", False, f"Error: {str(e)}")

    def test_download_pdf(self):
        """Test GET /api/proposals/{id}/pdf"""
        print("\n📋 Test 6: GET /api/proposals/{id}/pdf")
        if not self.test_proposal_id:
            self.log_test("Download proposal PDF", False, "No test proposal ID available")
            return
            
        try:
            response = requests.get(
                f"{BASE_URL}/proposals/{self.test_proposal_id}/pdf",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=15
            )
            
            status_ok = response.status_code == 200
            content_type_ok = "application/pdf" in response.headers.get("content-type", "")
            size_ok = len(response.content) >= 10000  # At least 10KB
            
            all_ok = status_ok and content_type_ok and size_ok
            details = f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}, Size: {len(response.content)} bytes"
            self.log_test("Download proposal PDF", all_ok, details)
                
        except Exception as e:
            self.log_test("Download proposal PDF", False, f"Error: {str(e)}")

    def test_delete_proposal(self):
        """Test DELETE /api/proposals/{id}"""
        print("\n📋 Test 7: DELETE /api/proposals/{id}")
        if not self.test_proposal_id:
            self.log_test("Delete proposal", False, "No test proposal ID available")
            return
            
        try:
            response = requests.delete(
                f"{BASE_URL}/proposals/{self.test_proposal_id}",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            
            status_ok = response.status_code == 200
            details = f"Status: {response.status_code}"
            self.log_test("Delete proposal", status_ok, details)
                
        except Exception as e:
            self.log_test("Delete proposal", False, f"Error: {str(e)}")

    def test_get_deleted_proposal(self):
        """Test GET /api/proposals/{id} after delete (should return 404)"""
        print("\n📋 Test 8: GET /api/proposals/{id} after delete (should return 404)")
        if not self.test_proposal_id:
            self.log_test("Get deleted proposal", False, "No test proposal ID available")
            return
            
        try:
            response = requests.get(
                f"{BASE_URL}/proposals/{self.test_proposal_id}",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            
            status_ok = response.status_code == 404
            details = f"Status: {response.status_code}"
            self.log_test("Get deleted proposal returns 404", status_ok, details)
                
        except Exception as e:
            self.log_test("Get deleted proposal returns 404", False, f"Error: {str(e)}")

    def test_packages_endpoint(self):
        """Test GET /api/packages to verify packages exist"""
        print("\n📋 Test 9: GET /api/packages (verify packages exist)")
        try:
            response = requests.get(f"{BASE_URL}/packages", timeout=10)
            
            status_ok = response.status_code == 200
            if status_ok:
                data = response.json()
                is_list = isinstance(data, list)
                has_packages = len(data) >= 4  # Should have at least 4 packages
                
                # Check for essential package
                essential_exists = any(p.get("slug") == "essential" for p in data)
                
                all_ok = status_ok and is_list and has_packages and essential_exists
                details = f"Status: {response.status_code}, Count: {len(data)}, Has Essential: {essential_exists}"
                self.log_test("Packages endpoint", all_ok, details)
            else:
                self.log_test("Packages endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Packages endpoint", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 70)
        print("🚀 CLIENT PROPOSALS BACKEND TESTING")
        print("=" * 70)
        
        # Login as admin
        if not self.admin_login():
            print("❌ Admin login failed, cannot proceed with tests")
            return 1
        
        # Test packages endpoint first
        self.test_packages_endpoint()
        
        # Test proposals CRUD
        self.test_list_proposals_empty()
        self.test_create_proposal_valid()
        self.test_create_proposal_missing_required()
        self.test_get_proposal_by_id()
        self.test_update_proposal()
        self.test_download_pdf()
        self.test_delete_proposal()
        self.test_get_deleted_proposal()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 BACKEND TEST SUMMARY")
        print("=" * 70)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        print("=" * 70)
        
        return 0 if self.tests_passed == self.tests_run else 1

def main():
    tester = ProposalsBackendTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
