import sqlite3
from database import db

def test_violation_counts():
    """Test that violation counts are accurate and incremental."""
    
    # Test data
    test_session_id = "test-session-123"
    test_roll_no = "TEST001"
    
    print("Testing Violation Counting System")
    print("=" * 50)
    
    # Create a test session
    print("\n1. Creating test session...")
    db.create_session(test_session_id, None, [test_roll_no], "custom", "Test Exam", "Test Description")
    
    # Initial counts should be 0
    print("\n2. Checking initial counts (should be 0)...")
    counts = db.get_violation_counts(test_session_id, test_roll_no)
    print(f"   Mouse out: {counts['mouse_out_count']}")
    print(f"   Tab switch: {counts['tab_switch_count']}")
    assert counts['mouse_out_count'] == 0, "Initial mouse_out_count should be 0"
    assert counts['tab_switch_count'] == 0, "Initial tab_switch_count should be 0"
    print("   ✓ Initial counts correct!")
    
    # Add 3 mouse out violations
    print("\n3. Adding 3 mouse out violations...")
    for i in range(3):
        db.save_violation(test_session_id, test_roll_no, "mouse_out")
        counts = db.get_violation_counts(test_session_id, test_roll_no)
        expected = i + 1
        print(f"   After violation {expected}: mouse_out_count = {counts['mouse_out_count']}")
        assert counts['mouse_out_count'] == expected, f"Count should be {expected}"
    print("   ✓ Mouse out counting works correctly!")
    
    # Add 2 tab switch violations
    print("\n4. Adding 2 tab switch violations...")
    for i in range(2):
        db.save_violation(test_session_id, test_roll_no, "tab_switch")
        counts = db.get_violation_counts(test_session_id, test_roll_no)
        expected = i + 1
        print(f"   After violation {expected}: tab_switch_count = {counts['tab_switch_count']}")
        assert counts['tab_switch_count'] == expected, f"Count should be {expected}"
    print("   ✓ Tab switch counting works correctly!")
    
    # Final verification
    print("\n5. Final count verification...")
    counts = db.get_violation_counts(test_session_id, test_roll_no)
    print(f"   Mouse out: {counts['mouse_out_count']} (expected: 3)")
    print(f"   Tab switch: {counts['tab_switch_count']} (expected: 2)")
    assert counts['mouse_out_count'] == 3, "Final mouse_out_count should be 3"
    assert counts['tab_switch_count'] == 2, "Final tab_switch_count should be 2"
    print("   ✓ Final counts correct!")
    
    # Check database directly
    print("\n6. Verifying database records...")
    conn = sqlite3.connect(db.db_path)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT violation_type, COUNT(*) 
        FROM violations 
        WHERE session_id = ? AND roll_no = ?
        GROUP BY violation_type
    """, (test_session_id, test_roll_no))
    
    db_counts = dict(cursor.fetchall())
    print(f"   Database mouse_out records: {db_counts.get('mouse_out', 0)}")
    print(f"   Database tab_switch records: {db_counts.get('tab_switch', 0)}")
    conn.close()
    
    assert db_counts.get('mouse_out', 0) == 3, "Database should have 3 mouse_out records"
    assert db_counts.get('tab_switch', 0) == 2, "Database should have 2 tab_switch records"
    print("   ✓ Database records match!")
    
    # Cleanup
    print("\n7. Cleaning up test data...")
    db.delete_session(test_session_id)
    print("   ✓ Test data cleaned up!")
    
    print("\n" + "=" * 50)
    print("✅ ALL TESTS PASSED! Violation counting is accurate.")
    print("=" * 50)

if __name__ == "__main__":
    try:
        test_violation_counts()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
