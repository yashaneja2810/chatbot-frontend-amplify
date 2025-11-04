# Complete AWS Migration Script
# This script performs the entire migration automatically

param(
    [Parameter(Mandatory=$true)]
    [string]$GoogleApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$SupabaseUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$SupabaseKey,
    