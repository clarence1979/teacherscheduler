/*
  # Fix Row Level Security policies for profiles table

  1. Security Updates
    - Drop existing restrictive policies
    - Add proper INSERT policy for profile creation during signup
    - Add proper SELECT policy for users to read their own profile
    - Add proper UPDATE policy for users to modify their own profile

  2. Changes
    - Allow authenticated users to insert their own profile during signup
    - Allow authenticated users to read and update their own profile data
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow users to insert their own profile (critical for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);