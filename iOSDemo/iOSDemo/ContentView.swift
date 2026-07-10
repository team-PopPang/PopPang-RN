//
//  ContentView.swift
//  iOSDemo
//
//  Created by 김동현 on 7/10/26.
//

import SwiftUI
import React

struct ContentView: View {
    var body: some View {
        VStack {
            
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
