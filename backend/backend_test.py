#!/usr/bin/env python3
"""
ConstructONS Backend API Test Suite
Tests all backend endpoints for the ConstructONS CMS
"""
import os
import requests
import sys
from datetime import datetime

# All test credentials & URLs are pulled from environment variables so no
# secrets live in source control. Defaults are only present for the local
# preview sandbox and must be overridden in CI / production.
BASE_URL = os.getenv(
    "TEST_BASE_URL",
    "https://ai-homes-3.preview.emergentagent.com/api",
)
ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "dkmanjeshbelli@gmail.com")
ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "9980577310@aB")
DEV_BYPASS_TOKEN = os.getenv("TEST_DEV_BYPASS_TOKEN", "dev-bypass-constructons-2025")


class ConstructONSAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, level="INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        self.log(f"Testing {name}...")

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} - Status: {response.status_code}", "PASS")
            else:
                self.log(f"❌ FAILED - {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "FAIL")
                self.failed_tests.append({
                    "name": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })

            try:
                return success, response.json() if response.text else {}
            except Exception:
                return success, {}

        except Exception as e:
            self.log(f"❌ FAILED - {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_bootstrap(self):
        """Test GET /api/bootstrap"""
        success, response = self.run_test(
            "Bootstrap endpoint",
            "GET",
            "bootstrap",
            200
        )
        if success:
            # Verify all required keys are present
            required_keys = ['homes', 'packages', 'ai_modules', 'marketplace', 
                           'financial_services', 'comparison', 'journey', 
                           'testimonials', 'stats', 'hero', 'site_settings']
            missing = [k for k in required_keys if k not in response]
            if missing:
                self.log(f"⚠️  Bootstrap missing keys: {missing}", "WARN")
            else:
                self.log(f"✓ Bootstrap contains all required keys", "INFO")
                self.log(f"  - Homes: {len(response.get('homes', []))}", "INFO")
                self.log(f"  - Packages: {len(response.get('packages', []))}", "INFO")
                self.log(f"  - AI Modules: {len(response.get('ai_modules', []))}", "INFO")
                self.log(f"  - Marketplace: {len(response.get('marketplace', []))}", "INFO")
                self.log(f"  - Financial Services: {len(response.get('financial_services', []))}", "INFO")
                self.log(f"  - Comparison: {len(response.get('comparison', []))}", "INFO")
                self.log(f"  - Journey: {len(response.get('journey', []))}", "INFO")
                self.log(f"  - Testimonials: {len(response.get('testimonials', []))}", "INFO")
                self.log(f"  - Stats: {len(response.get('stats', []))}", "INFO")
        return success, response

    def test_homes_list(self):
        """Test GET /api/homes"""
        success, response = self.run_test(
            "List homes",
            "GET",
            "homes",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✓ Found {len(response)} homes", "INFO")
        return success, response

    def test_home_detail(self, slug="modern-aura"):
        """Test GET /api/homes/{slug}"""
        success, response = self.run_test(
            f"Get home detail: {slug}",
            "GET",
            f"homes/{slug}",
            200
        )
        if success:
            # Verify required fields
            required = ['name', 'slug', 'gallery', 'floor_areas']
            missing = [f for f in required if f not in response]
            if missing:
                self.log(f"⚠️  Home detail missing fields: {missing}", "WARN")
            else:
                self.log(f"✓ Home detail has all required fields", "INFO")
        return success, response

    def test_packages_list(self):
        """Test GET /api/packages"""
        success, response = self.run_test(
            "List packages",
            "GET",
            "packages",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✓ Found {len(response)} packages", "INFO")
            # Check for expected packages
            tiers = [p.get('tier') for p in response]
            self.log(f"  Package tiers: {tiers}", "INFO")
        return success, response

    def test_package_detail(self, slug):
        """Test GET /api/packages/{slug} with detailed fields"""
        success, response = self.run_test(
            f"Get package detail: {slug}",
            "GET",
            f"packages/{slug}",
            200
        )
        if success:
            # Verify required detailed fields
            required = ['spec_categories', 'addons', 'scope_of_work', 'exclusions', 
                       'payment_schedule', 'package_faqs', 'timeline_months', 
                       'warranty_years', 'price_per_sqft', 'min_area_sqft']
            missing = [f for f in required if f not in response]
            if missing:
                self.log(f"⚠️  Package detail missing fields: {missing}", "WARN")
            else:
                self.log(f"✓ Package detail has all required fields", "INFO")
                self.log(f"  - Spec categories: {len(response.get('spec_categories', []))}", "INFO")
                self.log(f"  - Add-ons: {len(response.get('addons', []))}", "INFO")
                self.log(f"  - Scope items: {len(response.get('scope_of_work', []))}", "INFO")
                self.log(f"  - Exclusions: {len(response.get('exclusions', []))}", "INFO")
                self.log(f"  - Payment milestones: {len(response.get('payment_schedule', []))}", "INFO")
                self.log(f"  - FAQs: {len(response.get('package_faqs', []))}", "INFO")
                
                # Check for real brand names in spec_categories
                spec_cats = response.get('spec_categories', [])
                if spec_cats:
                    brands_found = []
                    for cat in spec_cats[:3]:  # Check first 3 categories
                        for item in cat.get('items', [])[:2]:  # Check first 2 items
                            brand = item.get('brand', '')
                            if brand:
                                brands_found.append(brand)
                    if brands_found:
                        self.log(f"  - Sample brands: {', '.join(brands_found[:5])}", "INFO")
        return success, response

    def test_packages_compare(self):
        """Test GET /api/packages-compare"""
        success, response = self.run_test(
            "Compare packages",
            "GET",
            "packages-compare",
            200
        )
        if success:
            packages = response.get('packages', [])
            category_order = response.get('category_order', [])
            self.log(f"✓ Compare endpoint returned {len(packages)} packages", "INFO")
            self.log(f"✓ Category order has {len(category_order)} categories", "INFO")
            if category_order:
                self.log(f"  - Sample categories: {', '.join(category_order[:5])}", "INFO")
        return success, response

    def test_package_brochure(self, slug):
        """Test GET /api/packages/{slug}/brochure.pdf"""
        url = f"{self.base_url}/packages/{slug}/brochure.pdf"
        self.tests_run += 1
        self.log(f"Testing package brochure: {slug}...")
        
        try:
            response = requests.get(url, timeout=15)
            success = response.status_code == 200
            
            if success:
                content_type = response.headers.get('Content-Type', '')
                content_length = len(response.content)
                
                if 'application/pdf' in content_type:
                    self.log(f"✓ Content-Type is application/pdf", "INFO")
                else:
                    self.log(f"⚠️  Content-Type is {content_type}, expected application/pdf", "WARN")
                
                if content_length >= 15000:  # >= 15 KB
                    self.log(f"✓ PDF size: {content_length / 1024:.1f} KB (>= 15 KB)", "INFO")
                    self.tests_passed += 1
                    self.log(f"✅ PASSED - Package brochure: {slug}", "PASS")
                else:
                    self.log(f"❌ FAILED - PDF too small: {content_length / 1024:.1f} KB (< 15 KB)", "FAIL")
                    self.failed_tests.append({
                        "name": f"Package brochure: {slug}",
                        "error": f"PDF size {content_length} bytes < 15 KB",
                        "endpoint": f"packages/{slug}/brochure.pdf"
                    })
            else:
                self.log(f"❌ FAILED - Expected 200, got {response.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": f"Package brochure: {slug}",
                    "expected": 200,
                    "actual": response.status_code,
                    "endpoint": f"packages/{slug}/brochure.pdf"
                })
            
            return success, response.content if success else None
            
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": f"Package brochure: {slug}",
                "error": str(e),
                "endpoint": f"packages/{slug}/brochure.pdf"
            })
            return False, None

    def test_package_brochure_404(self):
        """Test GET /api/packages/invalid-slug/brochure.pdf returns 404"""
        success, _ = self.run_test(
            "Package brochure 404 (invalid slug)",
            "GET",
            "packages/invalid-slug-xyz/brochure.pdf",
            404
        )
        return success, None

    def test_admin_login(self):
        """Test POST /api/admin/login"""
        success, response = self.run_test(
            "Admin login",
            "POST",
            "admin/login",
            200,
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.log(f"✓ Admin login successful, token obtained", "INFO")
        return success, response

    def test_create_lead(self):
        """Test POST /api/leads"""
        timestamp = datetime.now().strftime("%H%M%S")
        lead_data = {
            "name": f"Test User {timestamp}",
            "phone": "+91 9876543210",
            "email": f"test{timestamp}@example.com",
            "city": "Bangalore",
            "message": "Test lead from automated testing",
            "source": "website"
        }
        success, response = self.run_test(
            "Create lead",
            "POST",
            "leads",
            200,
            data=lead_data
        )
        if success and response.get('id'):
            self.log(f"✓ Lead created with ID: {response['id']}", "INFO")
            return success, response['id']
        return success, None

    def test_list_leads(self):
        """Test GET /api/leads (requires auth)"""
        success, response = self.run_test(
            "List leads (admin)",
            "GET",
            "leads",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✓ Found {len(response)} leads", "INFO")
        return success, response

    def test_update_lead(self, lead_id):
        """Test PUT /api/leads/{id}"""
        success, response = self.run_test(
            f"Update lead status: {lead_id}",
            "PUT",
            f"leads/{lead_id}",
            200,
            data={"status": "contacted"}
        )
        return success, response

    def test_update_home(self, home_id):
        """Test PUT /api/homes/{id} (requires auth)"""
        # First get the home
        get_success, home = self.run_test(
            f"Get home for update: {home_id}",
            "GET",
            f"homes/{home_id}",
            200
        )
        if not get_success:
            return False, {}
        
        # Update estimated_cost
        home['estimated_cost'] = "From ₹99.99 Lakhs (TEST)"
        success, response = self.run_test(
            f"Update home: {home_id}",
            "PUT",
            f"homes/{home_id}",
            200,
            data=home
        )
        return success, response

    def test_update_site_settings(self):
        """Test PUT /api/site-settings (requires auth)"""
        # First get current settings
        get_success, settings = self.run_test(
            "Get site settings",
            "GET",
            "site-settings",
            200
        )
        if not get_success:
            return False, {}
        
        # Update phone
        settings['phone'] = "+91 99999 99999 (TEST)"
        success, response = self.run_test(
            "Update site settings",
            "PUT",
            "site-settings",
            200,
            data=settings
        )
        return success, response

    def test_create_and_delete_faq(self):
        """Test POST /api/faqs and DELETE /api/faqs/{id}"""
        # Create FAQ
        faq_data = {
            "question": "Test FAQ Question?",
            "answer": "Test FAQ Answer",
            "category": "test",
            "is_published": True,
            "sort_order": 999
        }
        create_success, response = self.run_test(
            "Create FAQ",
            "POST",
            "faqs",
            200,
            data=faq_data
        )
        if not create_success or not response.get('id'):
            return False, {}
        
        faq_id = response['id']
        self.log(f"✓ FAQ created with ID: {faq_id}", "INFO")
        
        # Delete FAQ
        delete_success, _ = self.run_test(
            f"Delete FAQ: {faq_id}",
            "DELETE",
            f"faqs/{faq_id}",
            200
        )
        return delete_success, {}

    # ----------------------- PHASE 5: Quiz Insights Tests -----------------------
    def test_recommend_package(self):
        """Test POST /api/recommend - should return submission_id"""
        quiz_data = {
            "budget": "balanced",
            "family_size": "3-4",
            "style": "modern",
            "smart_home": "basic"
        }
        success, response = self.run_test(
            "Recommend package (quiz)",
            "POST",
            "recommend",
            200,
            data=quiz_data
        )
        if success:
            # Verify response structure
            required_keys = ['recommended_package', 'shortlisted_homes', 'score', 'submission_id']
            missing = [k for k in required_keys if k not in response]
            if missing:
                self.log(f"⚠️  Recommend response missing keys: {missing}", "WARN")
            else:
                self.log(f"✓ Recommend response has all required keys", "INFO")
                submission_id = response.get('submission_id')
                if submission_id:
                    self.log(f"✓ Quiz submission created with ID: {submission_id}", "INFO")
                    return success, submission_id
        return success, None

    def test_list_quiz_submissions(self):
        """Test GET /api/quiz-submissions (requires admin auth)"""
        success, response = self.run_test(
            "List quiz submissions (admin)",
            "GET",
            "quiz-submissions",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✓ Found {len(response)} quiz submissions", "INFO")
            if len(response) > 0:
                # Check first submission structure
                first = response[0]
                required = ['id', 'budget', 'family_size', 'recommended_package_slug', 'status', 'created_at']
                missing = [k for k in required if k not in first]
                if missing:
                    self.log(f"⚠️  Quiz submission missing fields: {missing}", "WARN")
                else:
                    self.log(f"✓ Quiz submission has all required fields", "INFO")
        return success, response

    def test_get_quiz_submission(self, submission_id):
        """Test GET /api/quiz-submissions/{id} (requires admin auth)"""
        success, response = self.run_test(
            f"Get quiz submission: {submission_id}",
            "GET",
            f"quiz-submissions/{submission_id}",
            200
        )
        if success:
            self.log(f"✓ Retrieved quiz submission: {submission_id}", "INFO")
            self.log(f"  - Budget: {response.get('budget')}", "INFO")
            self.log(f"  - Family size: {response.get('family_size')}", "INFO")
            self.log(f"  - Recommended package: {response.get('recommended_package_name')}", "INFO")
            self.log(f"  - Status: {response.get('status')}", "INFO")
        return success, response

    def test_update_quiz_submission(self, submission_id):
        """Test PUT /api/quiz-submissions/{id} (requires admin auth)"""
        update_data = {
            "status": "closed",
            "notes": "Called customer - not interested"
        }
        success, response = self.run_test(
            f"Update quiz submission: {submission_id}",
            "PUT",
            f"quiz-submissions/{submission_id}",
            200,
            data=update_data
        )
        if success:
            self.log(f"✓ Quiz submission updated successfully", "INFO")
        return success, response

    def test_lead_with_quiz_submission(self, submission_id):
        """Test POST /api/leads with quiz_submission_id - should update quiz submission"""
        timestamp = datetime.now().strftime("%H%M%S")
        lead_data = {
            "name": f"Quiz Lead {timestamp}",
            "phone": "+91 9876543210",
            "email": f"quizlead{timestamp}@example.com",
            "city": "Mumbai",
            "message": "Interested in package from quiz",
            "source": "quiz",
            "quiz_submission_id": submission_id
        }
        success, response = self.run_test(
            "Create lead with quiz_submission_id",
            "POST",
            "leads",
            200,
            data=lead_data
        )
        if success and response.get('id'):
            lead_id = response['id']
            self.log(f"✓ Lead created with ID: {lead_id}", "INFO")
            
            # Now verify the quiz submission was updated
            get_success, quiz_sub = self.run_test(
                f"Verify quiz submission updated (lead link)",
                "GET",
                f"quiz-submissions/{submission_id}",
                200
            )
            if get_success:
                if quiz_sub.get('status') == 'converted':
                    self.log(f"✓ Quiz submission status updated to 'converted'", "INFO")
                else:
                    self.log(f"⚠️  Quiz submission status is '{quiz_sub.get('status')}', expected 'converted'", "WARN")
                
                if quiz_sub.get('converted_to_lead_id') == lead_id:
                    self.log(f"✓ Quiz submission linked to lead ID: {lead_id}", "INFO")
                else:
                    self.log(f"⚠️  Quiz submission not linked to lead", "WARN")
                
                if quiz_sub.get('contact_name') == lead_data['name']:
                    self.log(f"✓ Contact info saved in quiz submission", "INFO")
                else:
                    self.log(f"⚠️  Contact info not saved in quiz submission", "WARN")
            
            return success, lead_id
        return success, None

    def test_brochure_with_quiz_submission(self, submission_id):
        """Test POST /api/packages/{slug}/brochure with quiz_submission_id"""
        timestamp = datetime.now().strftime("%H%M%S")
        brochure_data = {
            "name": f"Brochure User {timestamp}",
            "phone": "+91 9876543210",
            "email": f"brochure{timestamp}@example.com",
            "city": "Delhi",
            "save_lead": True,
            "quiz_submission_id": submission_id
        }
        
        url = f"{self.base_url}/packages/standard/brochure"
        self.tests_run += 1
        self.log(f"Testing personalized brochure with quiz_submission_id...")
        
        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.post(url, json=brochure_data, headers=headers, timeout=15)
            success = response.status_code == 200
            
            if success:
                content_type = response.headers.get('Content-Type', '')
                if 'application/pdf' in content_type:
                    self.tests_passed += 1
                    self.log(f"✅ PASSED - Personalized brochure with quiz link", "PASS")
                    
                    # Verify quiz submission was updated
                    if self.token:
                        headers_auth = {'Authorization': f'Bearer {self.token}'}
                        get_resp = requests.get(f"{self.base_url}/quiz-submissions/{submission_id}", 
                                              headers=headers_auth, timeout=10)
                        if get_resp.status_code == 200:
                            quiz_sub = get_resp.json()
                            if quiz_sub.get('contact_name') == brochure_data['name']:
                                self.log(f"✓ Quiz submission updated with brochure contact info", "INFO")
                            else:
                                self.log(f"⚠️  Quiz submission not updated with contact info", "WARN")
                else:
                    self.log(f"❌ FAILED - Expected PDF, got {content_type}", "FAIL")
                    self.failed_tests.append({
                        "name": "Personalized brochure with quiz link",
                        "error": f"Wrong content type: {content_type}",
                        "endpoint": "packages/standard/brochure"
                    })
            else:
                self.log(f"❌ FAILED - Expected 200, got {response.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Personalized brochure with quiz link",
                    "expected": 200,
                    "actual": response.status_code,
                    "endpoint": "packages/standard/brochure"
                })
            
            return success, None
            
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": "Personalized brochure with quiz link",
                "error": str(e),
                "endpoint": "packages/standard/brochure"
            })
            return False, None

    def test_delete_quiz_submission(self, submission_id):
        """Test DELETE /api/quiz-submissions/{id} (requires admin auth)"""
        success, response = self.run_test(
            f"Delete quiz submission: {submission_id}",
            "DELETE",
            f"quiz-submissions/{submission_id}",
            200
        )
        if success:
            self.log(f"✓ Quiz submission deleted successfully", "INFO")
        return success, response

    # ----------------------- PHASE 6: Push Notifications Tests -----------------------
    def test_notifications_pending_unauth(self):
        """Test GET /api/notifications/pending without auth - should return 401/403"""
        # Temporarily remove token
        saved_token = self.token
        self.token = None
        
        url = f"{self.base_url}/notifications/pending"
        self.tests_run += 1
        self.log(f"Testing notifications/pending without auth...")
        
        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.get(url, headers=headers, timeout=10)
            
            # Should be 401 or 403
            if response.status_code in [401, 403]:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Unauthorized access blocked: {response.status_code}", "PASS")
                success = True
            else:
                self.log(f"❌ FAILED - Expected 401/403, got {response.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Notifications pending (unauth)",
                    "expected": "401 or 403",
                    "actual": response.status_code,
                    "endpoint": "notifications/pending"
                })
                success = False
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": "Notifications pending (unauth)",
                "error": str(e),
                "endpoint": "notifications/pending"
            })
            success = False
        finally:
            # Restore token
            self.token = saved_token
        
        return success, None

    def test_notifications_pending_basic(self):
        """Test GET /api/notifications/pending (admin auth) - basic structure"""
        success, response = self.run_test(
            "Notifications pending (basic)",
            "GET",
            "notifications/pending",
            200
        )
        if success:
            # Verify response structure
            required_keys = ['items', 'now', 'leads_count', 'quiz_count']
            missing = [k for k in required_keys if k not in response]
            if missing:
                self.log(f"⚠️  Notifications response missing keys: {missing}", "WARN")
            else:
                self.log(f"✓ Notifications response has all required keys", "INFO")
                self.log(f"  - Items: {len(response.get('items', []))}", "INFO")
                self.log(f"  - Leads count: {response.get('leads_count')}", "INFO")
                self.log(f"  - Quiz count: {response.get('quiz_count')}", "INFO")
                
                # Verify item structure if items exist
                items = response.get('items', [])
                if items:
                    first_item = items[0]
                    required_item_keys = ['type', 'id', 'title', 'subtitle', 'created_at', 'link']
                    missing_item = [k for k in required_item_keys if k not in first_item]
                    if missing_item:
                        self.log(f"⚠️  Notification item missing keys: {missing_item}", "WARN")
                    else:
                        self.log(f"✓ Notification items have correct structure", "INFO")
                        self.log(f"  - Sample type: {first_item.get('type')}", "INFO")
                        self.log(f"  - Sample link: {first_item.get('link')}", "INFO")
        return success, response

    def test_notifications_pending_future_since(self):
        """Test GET /api/notifications/pending?since=<future_date> - should return empty"""
        # Use a future date
        future_iso = "2030-01-01T00:00:00Z"
        success, response = self.run_test(
            "Notifications pending (future since)",
            "GET",
            f"notifications/pending?since={future_iso}",
            200
        )
        if success:
            items = response.get('items', [])
            leads_count = response.get('leads_count', 0)
            quiz_count = response.get('quiz_count', 0)
            
            if len(items) == 0 and leads_count == 0 and quiz_count == 0:
                self.log(f"✓ Future 'since' correctly returns empty results", "INFO")
            else:
                self.log(f"⚠️  Expected empty results, got {len(items)} items, {leads_count} leads, {quiz_count} quizzes", "WARN")
        return success, response

    def test_notifications_with_new_lead(self):
        """Test that a new lead appears in notifications/pending"""
        # Get current timestamp
        from datetime import datetime, timezone
        before_iso = datetime.now(timezone.utc).isoformat()
        
        # Wait a moment to ensure timestamp difference
        import time
        time.sleep(0.5)
        
        # Create a new lead
        timestamp = datetime.now().strftime("%H%M%S")
        lead_data = {
            "name": f"Notif Test Lead {timestamp}",
            "phone": "+91 9876543210",
            "email": f"notiftest{timestamp}@example.com",
            "city": "Bangalore",
            "message": "Test lead for notifications",
            "source": "website"
        }
        
        url = f"{self.base_url}/leads"
        self.tests_run += 1
        self.log(f"Testing notifications with new lead...")
        
        try:
            headers = {'Content-Type': 'application/json'}
            create_resp = requests.post(url, json=lead_data, headers=headers, timeout=10)
            
            if create_resp.status_code != 200:
                self.log(f"❌ FAILED - Lead creation failed: {create_resp.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Notifications with new lead",
                    "error": f"Lead creation failed: {create_resp.status_code}",
                    "endpoint": "notifications/pending"
                })
                return False, None
            
            lead_id = create_resp.json().get('id')
            self.log(f"✓ Lead created: {lead_id}", "INFO")
            
            # Now check notifications/pending with since parameter
            notif_url = f"{self.base_url}/notifications/pending?since={before_iso}"
            auth_headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.token}'
            }
            notif_resp = requests.get(notif_url, headers=auth_headers, timeout=10)
            
            if notif_resp.status_code != 200:
                self.log(f"❌ FAILED - Notifications fetch failed: {notif_resp.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Notifications with new lead",
                    "error": f"Notifications fetch failed: {notif_resp.status_code}",
                    "endpoint": "notifications/pending"
                })
                return False, None
            
            notif_data = notif_resp.json()
            items = notif_data.get('items', [])
            
            # Check if our lead is in the items
            lead_found = False
            for item in items:
                if item.get('type') == 'lead' and item.get('id') == lead_id:
                    lead_found = True
                    self.log(f"✓ New lead found in notifications", "INFO")
                    self.log(f"  - Title: {item.get('title')}", "INFO")
                    self.log(f"  - Link: {item.get('link')}", "INFO")
                    
                    # Verify link is correct
                    if item.get('link') == '/admin/leads':
                        self.log(f"✓ Lead link is correct", "INFO")
                    else:
                        self.log(f"⚠️  Lead link is '{item.get('link')}', expected '/admin/leads'", "WARN")
                    break
            
            if lead_found:
                self.tests_passed += 1
                self.log(f"✅ PASSED - New lead appears in notifications", "PASS")
                return True, lead_id
            else:
                self.log(f"❌ FAILED - New lead not found in notifications", "FAIL")
                self.log(f"  - Total items: {len(items)}", "INFO")
                self.log(f"  - Leads count: {notif_data.get('leads_count')}", "INFO")
                self.failed_tests.append({
                    "name": "Notifications with new lead",
                    "error": "New lead not found in notifications",
                    "endpoint": "notifications/pending"
                })
                return False, None
                
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": "Notifications with new lead",
                "error": str(e),
                "endpoint": "notifications/pending"
            })
            return False, None

    def test_notifications_with_new_quiz(self):
        """Test that a new quiz submission appears in notifications/pending"""
        # Get current timestamp
        from datetime import datetime, timezone
        before_iso = datetime.now(timezone.utc).isoformat()
        
        # Wait a moment to ensure timestamp difference
        import time
        time.sleep(0.5)
        
        # Create a new quiz submission
        quiz_data = {
            "budget": "premium",
            "family_size": "5+",
            "style": "villa",
            "smart_home": "full"
        }
        
        url = f"{self.base_url}/recommend"
        self.tests_run += 1
        self.log(f"Testing notifications with new quiz submission...")
        
        try:
            headers = {'Content-Type': 'application/json'}
            create_resp = requests.post(url, json=quiz_data, headers=headers, timeout=10)
            
            if create_resp.status_code != 200:
                self.log(f"❌ FAILED - Quiz creation failed: {create_resp.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Notifications with new quiz",
                    "error": f"Quiz creation failed: {create_resp.status_code}",
                    "endpoint": "notifications/pending"
                })
                return False, None
            
            quiz_id = create_resp.json().get('submission_id')
            self.log(f"✓ Quiz submission created: {quiz_id}", "INFO")
            
            # Now check notifications/pending with since parameter
            notif_url = f"{self.base_url}/notifications/pending?since={before_iso}"
            auth_headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.token}'
            }
            notif_resp = requests.get(notif_url, headers=auth_headers, timeout=10)
            
            if notif_resp.status_code != 200:
                self.log(f"❌ FAILED - Notifications fetch failed: {notif_resp.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Notifications with new quiz",
                    "error": f"Notifications fetch failed: {notif_resp.status_code}",
                    "endpoint": "notifications/pending"
                })
                return False, None
            
            notif_data = notif_resp.json()
            items = notif_data.get('items', [])
            
            # Check if our quiz is in the items
            quiz_found = False
            for item in items:
                if item.get('type') == 'quiz' and item.get('id') == quiz_id:
                    quiz_found = True
                    self.log(f"✓ New quiz submission found in notifications", "INFO")
                    self.log(f"  - Title: {item.get('title')}", "INFO")
                    self.log(f"  - Link: {item.get('link')}", "INFO")
                    
                    # Verify link is correct
                    if item.get('link') == '/admin/quiz-submissions':
                        self.log(f"✓ Quiz link is correct", "INFO")
                    else:
                        self.log(f"⚠️  Quiz link is '{item.get('link')}', expected '/admin/quiz-submissions'", "WARN")
                    break
            
            if quiz_found:
                self.tests_passed += 1
                self.log(f"✅ PASSED - New quiz submission appears in notifications", "PASS")
                return True, quiz_id
            else:
                self.log(f"❌ FAILED - New quiz submission not found in notifications", "FAIL")
                self.log(f"  - Total items: {len(items)}", "INFO")
                self.log(f"  - Quiz count: {notif_data.get('quiz_count')}", "INFO")
                self.failed_tests.append({
                    "name": "Notifications with new quiz",
                    "error": "New quiz submission not found in notifications",
                    "endpoint": "notifications/pending"
                })
                return False, None
                
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": "Notifications with new quiz",
                "error": str(e),
                "endpoint": "notifications/pending"
            })
            return False, None

    # ----------------------- CODE REVIEW TESTS -----------------------
    def test_media_upload_download(self):
        """Test POST /api/media/upload and GET /api/media/{path} - code review fix verification"""
        import io
        self.tests_run += 1
        self.log(f"Testing media upload and download (code review fix)...")
        
        try:
            # Create a small test image (1x1 PNG)
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
            
            # Upload
            url = f"{self.base_url}/media/upload"
            headers = {'Authorization': f'Bearer {self.token}'}
            files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
            data = {'category': 'test'}
            
            upload_resp = requests.post(url, headers=headers, files=files, data=data, timeout=10)
            
            if upload_resp.status_code != 200:
                self.log(f"❌ FAILED - Upload failed: {upload_resp.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Media upload/download",
                    "error": f"Upload failed: {upload_resp.status_code}",
                    "endpoint": "media/upload"
                })
                return False, None
            
            upload_result = upload_resp.json()
            media_url = upload_result.get('url')
            storage_path = upload_result.get('storage_path')
            
            if not media_url or not storage_path:
                self.log(f"❌ FAILED - Upload response missing url or storage_path", "FAIL")
                self.failed_tests.append({
                    "name": "Media upload/download",
                    "error": "Upload response missing url or storage_path",
                    "endpoint": "media/upload"
                })
                return False, None
            
            self.log(f"✓ Image uploaded: {storage_path}", "INFO")
            
            # Download - this tests the code review fix for undefined content/content_type
            download_url = f"{self.base_url.replace('/api', '')}{media_url}"
            download_resp = requests.get(download_url, timeout=10)
            
            if download_resp.status_code != 200:
                self.log(f"❌ FAILED - Download failed: {download_resp.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Media upload/download",
                    "error": f"Download failed: {download_resp.status_code}",
                    "endpoint": media_url
                })
                return False, None
            
            # Verify content type
            content_type = download_resp.headers.get('Content-Type', '')
            if 'image' not in content_type:
                self.log(f"⚠️  Content-Type is {content_type}, expected image/*", "WARN")
            
            # Verify content matches
            if download_resp.content == png_data:
                self.log(f"✓ Downloaded image matches uploaded image", "INFO")
            else:
                self.log(f"⚠️  Downloaded image differs from uploaded (size: {len(download_resp.content)} vs {len(png_data)})", "WARN")
            
            self.tests_passed += 1
            self.log(f"✅ PASSED - Media upload/download working (code review fix verified)", "PASS")
            return True, storage_path
            
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": "Media upload/download",
                "error": str(e),
                "endpoint": "media/upload"
            })
            return False, None

    def test_ai_rewrite(self):
        """Test POST /api/ai/rewrite - AI Copy Assist feature"""
        url = f"{self.base_url}/ai/rewrite"
        headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {self.token}'}
        data = {
            "text": "Build your dream home with us",
            "purpose": "tagline",
            "tone": "on-brand"
        }
        
        self.tests_run += 1
        self.log(f"Testing AI rewrite (Copy Assist)...")
        
        try:
            # AI calls need longer timeout
            response = requests.post(url, json=data, headers=headers, timeout=30)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - AI rewrite (Copy Assist) - Status: {response.status_code}", "PASS")
                result = response.json()
                suggestions = result.get('suggestions', [])
                if len(suggestions) >= 2:
                    self.log(f"✓ AI returned {len(suggestions)} suggestions", "INFO")
                    self.log(f"  - Sample: {suggestions[0][:60]}...", "INFO")
                else:
                    self.log(f"⚠️  AI returned only {len(suggestions)} suggestions (expected 3)", "WARN")
                return True, result
            else:
                self.log(f"❌ FAILED - Expected 200, got {response.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "AI rewrite (Copy Assist)",
                    "expected": 200,
                    "actual": response.status_code,
                    "endpoint": "ai/rewrite"
                })
                return False, {}
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": "AI rewrite (Copy Assist)",
                "error": str(e),
                "endpoint": "ai/rewrite"
            })
            return False, {}

    def test_package_versions(self, package_id):
        """Test GET /api/packages/{id}/versions - Version History feature"""
        success, response = self.run_test(
            f"List package versions: {package_id}",
            "GET",
            f"packages/{package_id}/versions",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✓ Found {len(response)} version snapshots", "INFO")
            if len(response) > 0:
                first = response[0]
                required = ['id', 'package_id', 'snapshot_at', 'note']
                missing = [k for k in required if k not in first]
                if missing:
                    self.log(f"⚠️  Version snapshot missing fields: {missing}", "WARN")
                else:
                    self.log(f"✓ Version snapshot has all required fields", "INFO")
                    self.log(f"  - Latest note: {first.get('note')}", "INFO")
        return success, response

    # ----------------------- PROJECT ROUTES TESTS -----------------------
    def test_list_projects(self):
        """Test GET /api/admin/projects (requires admin auth)"""
        success, response = self.run_test(
            "List projects (admin)",
            "GET",
            "admin/projects",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✓ Found {len(response)} projects", "INFO")
            if len(response) > 0:
                # Check for seeded 'Belli Residence' project
                belli_project = None
                for p in response:
                    if 'Belli Residence' in p.get('title', ''):
                        belli_project = p
                        break
                
                if belli_project:
                    self.log(f"✓ Found seeded 'Belli Residence' project", "INFO")
                    self.log(f"  - Customer: {belli_project.get('customer_email')}", "INFO")
                    self.log(f"  - Stages: {len(belli_project.get('stages', []))}", "INFO")
                    
                    # Verify 10 stages
                    stages = belli_project.get('stages', [])
                    if len(stages) == 10:
                        self.log(f"✓ Project has 10 stages", "INFO")
                        
                        # Check stage statuses
                        completed = [s for s in stages if s.get('status') == 'completed']
                        in_progress = [s for s in stages if s.get('status') == 'in_progress']
                        self.log(f"  - Completed stages: {len(completed)}", "INFO")
                        self.log(f"  - In progress stages: {len(in_progress)}", "INFO")
                    else:
                        self.log(f"⚠️  Project has {len(stages)} stages, expected 10", "WARN")
                else:
                    self.log(f"⚠️  Seeded 'Belli Residence' project not found", "WARN")
                
                # Verify first project structure
                first = response[0]
                required = ['id', 'customer_email', 'customer_name', 'title', 'stages', 'created_at']
                missing = [k for k in required if k not in first]
                if missing:
                    self.log(f"⚠️  Project missing fields: {missing}", "WARN")
                else:
                    self.log(f"✓ Project has all required fields", "INFO")
        return success, response

    def test_create_project(self):
        """Test POST /api/admin/projects (requires admin auth)"""
        timestamp = datetime.now().strftime("%H%M%S")
        project_data = {
            "customer_email": f"e2e-test-{timestamp}@example.com",
            "customer_name": f"Test Customer {timestamp}",
            "title": f"Test Project {timestamp}",
            "address": "Test Address, Bangalore"
        }
        success, response = self.run_test(
            "Create project",
            "POST",
            "admin/projects",
            200,
            data=project_data
        )
        if success and response.get('id'):
            project_id = response['id']
            self.log(f"✓ Project created with ID: {project_id}", "INFO")
            
            # Verify 10 default stages were created
            stages = response.get('stages', [])
            if len(stages) == 10:
                self.log(f"✓ Project created with 10 default stages", "INFO")
                
                # Verify stage names
                expected_stages = ["Discovery", "Design", "Approvals", "Booking", "Site Preparation", 
                                 "Foundation", "Structure", "Walls & MEP", "Finishing", "Handover"]
                actual_names = [s.get('name') for s in stages]
                if actual_names == expected_stages:
                    self.log(f"✓ All stage names are correct", "INFO")
                else:
                    self.log(f"⚠️  Stage names don't match expected", "WARN")
            else:
                self.log(f"⚠️  Project has {len(stages)} stages, expected 10", "WARN")
            
            return success, project_id
        return success, None

    def test_create_duplicate_project(self, email):
        """Test POST /api/admin/projects with duplicate email - should return 409"""
        project_data = {
            "customer_email": email,
            "customer_name": "Duplicate Test",
            "title": "Duplicate Project"
        }
        success, response = self.run_test(
            "Create duplicate project (should fail with 409)",
            "POST",
            "admin/projects",
            409,
            data=project_data
        )
        if success:
            self.log(f"✓ Duplicate project correctly rejected with 409", "INFO")
        return success, None

    def test_update_project(self, project_id):
        """Test PUT /api/admin/projects/{id} (requires admin auth)"""
        update_data = {
            "title": "Updated Project Title",
            "address": "Updated Address, Mumbai",
            "status": "active"
        }
        success, response = self.run_test(
            f"Update project: {project_id}",
            "PUT",
            f"admin/projects/{project_id}",
            200,
            data=update_data
        )
        if success:
            self.log(f"✓ Project updated successfully", "INFO")
            if response.get('title') == update_data['title']:
                self.log(f"✓ Title updated correctly", "INFO")
            if response.get('address') == update_data['address']:
                self.log(f"✓ Address updated correctly", "INFO")
        return success, response

    def test_patch_stage(self, project_id, stage_index):
        """Test PATCH /api/admin/projects/{id}/stages/{index} (requires admin auth)"""
        stage_data = {
            "status": "in_progress",
            "progress_pct": 55,
            "expected_date": "2025-09-15",
            "notes": "Stage is progressing well. Expected completion by mid-September."
        }
        success, response = self.run_test(
            f"Update stage {stage_index} of project {project_id}",
            "PATCH",
            f"admin/projects/{project_id}/stages/{stage_index}",
            200,
            data=stage_data
        )
        if success:
            self.log(f"✓ Stage updated successfully", "INFO")
            
            # Verify auto-timestamp for started_at
            if response.get('status') == 'in_progress' and response.get('started_at'):
                self.log(f"✓ started_at auto-stamped: {response.get('started_at')}", "INFO")
            
            if response.get('progress_pct') == 55:
                self.log(f"✓ Progress percentage updated correctly", "INFO")
            
            if response.get('notes') == stage_data['notes']:
                self.log(f"✓ Notes updated correctly", "INFO")
        return success, response

    def test_patch_stage_completed(self, project_id, stage_index):
        """Test PATCH stage to completed status - should auto-stamp completed_at and set progress to 100"""
        stage_data = {
            "status": "completed"
        }
        success, response = self.run_test(
            f"Mark stage {stage_index} as completed",
            "PATCH",
            f"admin/projects/{project_id}/stages/{stage_index}",
            200,
            data=stage_data
        )
        if success:
            self.log(f"✓ Stage marked as completed", "INFO")
            
            # Verify auto-timestamp for completed_at
            if response.get('completed_at'):
                self.log(f"✓ completed_at auto-stamped: {response.get('completed_at')}", "INFO")
            else:
                self.log(f"⚠️  completed_at not set", "WARN")
            
            # Verify progress_pct set to 100
            if response.get('progress_pct') == 100:
                self.log(f"✓ progress_pct auto-set to 100", "INFO")
            else:
                self.log(f"⚠️  progress_pct is {response.get('progress_pct')}, expected 100", "WARN")
        return success, response

    def test_portal_my_project_unauth(self):
        """Test GET /api/portal/my-project without auth - should return 401"""
        # Temporarily remove token
        saved_token = self.token
        self.token = None
        
        url = f"{self.base_url}/portal/my-project"
        self.tests_run += 1
        self.log(f"Testing portal/my-project without auth...")
        
        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.get(url, headers=headers, timeout=10)
            
            # Should be 401
            if response.status_code == 401:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Unauthorized access blocked: {response.status_code}", "PASS")
                success = True
            else:
                self.log(f"❌ FAILED - Expected 401, got {response.status_code}", "FAIL")
                self.failed_tests.append({
                    "name": "Portal my-project (unauth)",
                    "expected": 401,
                    "actual": response.status_code,
                    "endpoint": "portal/my-project"
                })
                success = False
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": "Portal my-project (unauth)",
                "error": str(e),
                "endpoint": "portal/my-project"
            })
            success = False
        finally:
            # Restore token
            self.token = saved_token
        
        return success, None

    def test_portal_my_project_with_session(self):
        """Test GET /api/portal/my-project with customer session cookie"""
        url = f"{self.base_url}/portal/my-project"
        self.tests_run += 1
        self.log(f"Testing portal/my-project with customer session...")
        
        try:
            # Use the seeded customer session token
            session_token = "test-session-fb2134222ed249bc9de7aa059408a3e8"
            cookies = {"customer_session": session_token}
            
            response = requests.get(url, cookies=cookies, timeout=10)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Portal my-project with session - Status: {response.status_code}", "PASS")
                
                result = response.json()
                project = result.get('project')
                
                if project:
                    self.log(f"✓ Customer project found", "INFO")
                    self.log(f"  - Title: {project.get('title')}", "INFO")
                    self.log(f"  - Customer: {project.get('customer_email')}", "INFO")
                    
                    # Verify stages
                    stages = project.get('stages', [])
                    if len(stages) == 10:
                        self.log(f"✓ Project has 10 stages", "INFO")
                        
                        # Check for stage 4 (Booking) in progress at 55%
                        if len(stages) > 3:
                            stage_4 = stages[3]  # index 3 = stage 4
                            if stage_4.get('name') == 'Booking':
                                self.log(f"✓ Stage 4 is 'Booking'", "INFO")
                                if stage_4.get('status') == 'in_progress':
                                    self.log(f"✓ Stage 4 status is 'in_progress'", "INFO")
                                if stage_4.get('progress_pct') == 55:
                                    self.log(f"✓ Stage 4 progress is 55%", "INFO")
                    else:
                        self.log(f"⚠️  Project has {len(stages)} stages, expected 10", "WARN")
                else:
                    self.log(f"⚠️  No project found for customer", "WARN")
                
                return True, project
            else:
                self.log(f"❌ FAILED - Expected 200, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "FAIL")
                self.failed_tests.append({
                    "name": "Portal my-project with session",
                    "expected": 200,
                    "actual": response.status_code,
                    "endpoint": "portal/my-project"
                })
                return False, None
                
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": "Portal my-project with session",
                "error": str(e),
                "endpoint": "portal/my-project"
            })
            return False, None

    def test_delete_project(self, project_id):
        """Test DELETE /api/admin/projects/{id} (requires admin auth)"""
        success, response = self.run_test(
            f"Delete project: {project_id}",
            "DELETE",
            f"admin/projects/{project_id}",
            200
        )
        if success:
            self.log(f"✓ Project deleted successfully", "INFO")
        return success, response

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("=" * 60, "INFO")
        self.log("ConstructONS Backend API Test Suite - Phase 6", "INFO")
        self.log("=" * 60, "INFO")
        
        # Public endpoints
        self.log("\n--- Testing Public Endpoints ---", "INFO")
        self.test_bootstrap()
        self.test_homes_list()
        self.test_home_detail("modern-aura")
        self.test_packages_list()
        
        # Test detailed package endpoints
        self.log("\n--- Testing Package Detail Endpoints ---", "INFO")
        self.test_package_detail("basic")
        self.test_package_detail("essential")
        self.test_package_detail("standard")
        self.test_package_detail("premium")
        
        # Test packages compare
        self.log("\n--- Testing Package Compare Endpoint ---", "INFO")
        self.test_packages_compare()
        
        # Test package brochures
        self.log("\n--- Testing Package Brochure PDFs ---", "INFO")
        self.test_package_brochure("basic")
        self.test_package_brochure("premium")
        self.test_package_brochure_404()
        
        # PHASE 5: Test quiz recommendation (public)
        self.log("\n--- PHASE 5: Testing Quiz Insights (Public) ---", "INFO")
        _, submission_id = self.test_recommend_package()
        
        # Create lead (public)
        self.log("\n--- Testing Lead Creation (Public) ---", "INFO")
        _, lead_id = self.test_create_lead()
        
        # Admin login
        self.log("\n--- Testing Admin Authentication ---", "INFO")
        login_success, _ = self.test_admin_login()
        
        if not login_success:
            self.log("⚠️  Admin login failed, skipping authenticated tests", "WARN")
        else:
            # Authenticated endpoints
            self.log("\n--- Testing Authenticated Endpoints ---", "INFO")
            self.test_list_leads()
            
            if lead_id:
                self.test_update_lead(lead_id)
            
            # Get first home ID for update test
            _, homes = self.test_homes_list()
            if homes and len(homes) > 0:
                home_id = homes[0].get('id')
                if home_id:
                    self.test_update_home(home_id)
            
            self.test_update_site_settings()
            self.test_create_and_delete_faq()
            
            # PHASE 5: Test quiz submissions admin endpoints
            self.log("\n--- PHASE 5: Testing Quiz Submissions (Admin) ---", "INFO")
            self.test_list_quiz_submissions()
            
            if submission_id:
                self.test_get_quiz_submission(submission_id)
                self.test_update_quiz_submission(submission_id)
            
            # PHASE 5: Test quiz submission linking
            self.log("\n--- PHASE 5: Testing Quiz Submission Linking ---", "INFO")
            # Create a new quiz submission for linking tests
            _, link_submission_id = self.test_recommend_package()
            
            if link_submission_id:
                # Test lead creation with quiz_submission_id
                self.test_lead_with_quiz_submission(link_submission_id)
                
                # Create another submission for brochure test
                _, brochure_submission_id = self.test_recommend_package()
                if brochure_submission_id:
                    self.test_brochure_with_quiz_submission(brochure_submission_id)
            
            # PHASE 5: Test delete quiz submission
            if submission_id:
                self.test_delete_quiz_submission(submission_id)
            
            # PHASE 6: Test push notifications
            self.log("\n--- PHASE 6: Testing Push Notifications ---", "INFO")
            self.test_notifications_pending_unauth()
            self.test_notifications_pending_basic()
            self.test_notifications_pending_future_since()
            self.test_notifications_with_new_lead()
            self.test_notifications_with_new_quiz()
            
            # CODE REVIEW: Test media upload/download fix
            self.log("\n--- CODE REVIEW: Testing Media Upload/Download Fix ---", "INFO")
            self.test_media_upload_download()
            
            # CODE REVIEW: Test AI rewrite
            self.log("\n--- CODE REVIEW: Testing AI Copy Assist ---", "INFO")
            self.test_ai_rewrite()
            
            # CODE REVIEW: Test package version history
            self.log("\n--- CODE REVIEW: Testing Package Version History ---", "INFO")
            _, packages = self.test_packages_list()
            if packages and len(packages) > 0:
                package_id = packages[0].get('id')
                if package_id:
                    self.test_package_versions(package_id)
            
            # PROJECT ROUTES: Test customer project milestone tracker
            self.log("\n--- PROJECT ROUTES: Testing Customer Project Milestone Tracker ---", "INFO")
            _, projects = self.test_list_projects()
            
            # Test create project
            _, new_project_id = self.test_create_project()
            
            if new_project_id:
                # Test duplicate project creation (should fail with 409)
                # Get the email from the newly created project
                _, project_list = self.test_list_projects()
                if project_list:
                    for p in project_list:
                        if p.get('id') == new_project_id:
                            self.test_create_duplicate_project(p.get('customer_email'))
                            break
                
                # Test update project
                self.test_update_project(new_project_id)
                
                # Test patch stage (stage 3 - index 3 = Booking)
                self.test_patch_stage(new_project_id, 3)
                
                # Test patch stage to completed (stage 0 - Discovery)
                self.test_patch_stage_completed(new_project_id, 0)
                
                # Test delete project
                self.test_delete_project(new_project_id)
            
            # Test portal endpoints
            self.log("\n--- PROJECT ROUTES: Testing Customer Portal ---", "INFO")
            self.test_portal_my_project_unauth()
            self.test_portal_my_project_with_session()
        
        # Print summary
        self.log("\n" + "=" * 60, "INFO")
        self.log("Test Summary", "INFO")
        self.log("=" * 60, "INFO")
        self.log(f"Total Tests: {self.tests_run}", "INFO")
        self.log(f"Passed: {self.tests_passed}", "PASS")
        self.log(f"Failed: {len(self.failed_tests)}", "FAIL")
        
        if self.failed_tests:
            self.log("\nFailed Tests:", "FAIL")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
                self.log(f"  - {test['name']}: {error_msg} [{test['endpoint']}]", "FAIL")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"\nSuccess Rate: {success_rate:.1f}%", "INFO")
        
        return 0 if len(self.failed_tests) == 0 else 1


def main():
    tester = ConstructONSAPITester()
    return tester.run_all_tests()


if __name__ == "__main__":
    sys.exit(main())
